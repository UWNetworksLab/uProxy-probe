#! /usr/bin/python

import sys
import json
import select
import time
import threading
import signal
import optparse 
import socket
import SocketServer

""" 
This program should be run on a "server" machine with at least 2 public ips
to enable client side NAT detection. Existing code and configuration is coded
to be run in a EC2 instance, with one public ip (default), and one elastic ip 
(also public). It should be fairly easy to change the code to work in another
server environment as long as that server has more than one external ips.
"""

# global flag to notify any thread to exit if "Ctrl-C" is pressed.
quit_prog = False

def sigint_handler(signum, frame):
    global quit_prog
    print "keyboard event received, quitting"
    quit_prog = True

# global config
config = {}

def main():
    signal.signal(signal.SIGINT, sigint_handler)

    parser = optparse.OptionParser()
    parser.add_option("-c", "--config", dest="config_filename",
                      default="jsonserv.cfg",
                      help="configuration FILE in json format.", metavar="FILE")
    parser.add_option("-v", "--verbose", dest="verbose", action="store_false",
                      default=True, 
                      help="enable verbose debugging output.")
    parser.add_option("--local_port", dest="local_port", type="int",
                      help="local PORT for this program to listen to", metavar="PORT")

    (options, args) = parser.parse_args()
    global config
    config = json.load(open(options.config_filename))

    if options.local_port is not None:
        config['local_port'] = options.local_port
    if options.verbose is not None:
        config['verbose'] = options.verbose
    
    start_json_server(config)
    while not quit_prog:
        time.sleep(1)

serverThreadStopEvent = threading.Event()
secondSocket = None

class UDPHandler(SocketServer.BaseRequestHandler):
    """
    self.request consists of a pair of data and client socket, and since
    there is no connection the client address must be given explicitly
    when sending data back via sendto().
    """
    def handle(self):
        data = self.request[0].strip()
        sock = self.request[1]

        if config['verbose']:
          print 'from=%s:%s' % self.client_address
          print 'data=' + data

        req = json.loads(data)

        # round-time trip ping
        if req['ask'] == 'Ping':
          rsp = {
            'answer': 'Pong',
            'ping_time': req['ping_time']
          }
          sock.sendto(json.dumps(rsp), self.client_address) 

        # For full-cone detection, answer is sent from another ip/port.
        if req['ask'] == 'AmIFullCone':
          rsp = {
            'answer': 'FullCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          random_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
          random_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
          # pick a random port
          random_sock.bind((config['private_ip2'], 0))
          random_sock.sendto(json.dumps(rsp), self.client_address)

        # For restricted-cone detection, server tell the client to prepare
        # the mapping to the ip that will be used to send the answer.
        # Server instructs client to send to port 80, which is not being
        # listened by server for sure.
        elif req['ask'] == 'AmIRestrictedCone':
          rsp0 = {
            'answer': 'RestrictedConePrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '%s:80' % config['public_ip2']
          }
          for i in range(5):
            sock.sendto(json.dumps(rsp0), self.client_address)
            time.sleep(0.3)

          rsp = {
            'answer': 'RestrictedCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          for i in range(5):
            secondSocket.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)

        # For port restricted-cone detection, server tell the client to prepare
        # the mapping to the ip/port that will be used to send the answer. This
        # is the ip/port from which server will send the reply.
        elif req['ask'] == 'AmIPortRestrictedCone':
          second_port = config['second_port']
          rsp0 = {
            'answer': 'PortRestrictedConePrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '%s:%s' % (config['public_ip2'], second_port)
          }
          for i in range(5):
            sock.sendto(json.dumps(rsp0), self.client_address)
            time.sleep(0.3)

          rsp = {
            'answer': 'PortRestrictedCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          for i in range(5):
            secondSocket.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)

        # For symmetric NAT detection, the client is asked to send 2nd request
        # to 2nd ip/port pair. The reply need to be send in the same socket
        # where request is received. 
        elif req['ask'] == 'AmISymmetricNAT':
          rsp0 = {
            'answer': 'SymmetricNATPrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '%s:%s' %  (config['public_ip2'], config['second_port'])
          }
          sock.sendto(json.dumps(rsp0), self.client_address)


class SymmetricUDPHandler(SocketServer.BaseRequestHandler):
    def handle(self):
        data = self.request[0].strip()
        sock = self.request[1]

        if config['verbose']:
          print 'from=%s:%s' % self.client_address
          print 'data=' + data

        req = json.loads(data)

        if req['ask'] == 'AmISymmetricNAT':
          rsp = {
            'answer': 'SymmetricNAT',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          for i in range(5):
            sock.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)



class ThreadedUDPServer(SocketServer.ThreadingMixIn, SocketServer.UDPServer):
    pass


def start_json_server(config):
    SocketServer.ThreadingUDPServer.allow_reuse_address = True

    server = ThreadedUDPServer((config['private_ip1'], config['local_port']), UDPHandler)

    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread = threading.Thread(target=server.serve_forever)

    # Exit the server thread when the main thread terminates
    server_thread.daemon = True
    server_thread.start()
    print "Server loop running in thread:", server_thread.name

    server1 = ThreadedUDPServer((config['private_ip2'], config['second_port']), SymmetricUDPHandler)

    # record this second listen socket so that server can send reply from
    # this ip/port, but not as response to request received by this ip/port.
    global secondSocket
    secondSocket = server1.socket

    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread1 = threading.Thread(target=server1.serve_forever)

    # Exit the server thread when the main thread terminates
    server_thread1.daemon = True
    server_thread1.start()
    print "Server loop running in thread:", server_thread1.name

    

if __name__ == '__main__':
    main()

