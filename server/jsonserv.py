#! /usr/bin/python

import sys
import json
import pprint
import random
import datetime
import select
import time
import threading
import signal
import optparse 
import socket
import SocketServer


ECHO_PORT = 50000 + 7
BUFSIZE = 2048

quit_prog = False

def my_handler(signum, frame):
    global quit_prog
    print "keyboard event received, quitting"
    quit_prog = True

# global config
config = {}

def main():
    signal.signal(signal.SIGINT, my_handler)

    parser = optparse.OptionParser()
    parser.add_option("-c", "--config", dest="config_filename",
                      default="jsonserv.cfg",
                      help="configuration FILE in json format.", metavar="FILE")
    parser.add_option("-v", "--verbose", dest="verbose", action="store_false",
                      default=True, 
                      help="if the session is verbose.")
    parser.add_option("--host", dest="host", 
                      help="HOST name for client to connect to", metavar="HOST")
    parser.add_option("--local_port", dest="local_port", type="int",
                      help="local PORT for this program to listen to", metavar="PORT")
    parser.add_option("--remote_port", dest="remote_port", type="int",
                      help="remote PORT for this client to connect to.", metavar="PORT")

    (options, args) = parser.parse_args()
    global config
    config = json.load(open(options.config_filename))

    if options.local_port is not None:
        config['local_port'] = options.local_port
    if options.verbose is not None:
        config['verbose'] = options.verbose
    elif config['mode'] is None:
        config['mode'] = 'client'
    
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
        sock0 = self.request[1]

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
          sock0.sendto(json.dumps(rsp), self.client_address) 

        # For full-cone detection, answer is sent from another ip/port.
        if req['ask'] == 'AmIFullCone':
          rsp = {
            'answer': 'FullCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          sock1 = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
          sock1.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
          sock1.bind((config['interface1'], config['local_port'] + 1003))
          sock1.sendto(json.dumps(rsp), self.client_address)

        # For restricted-cone detection, server tell the client to prepare
        # the mapping to the ip that will be used to send the answer.
        # Client can choose to adjust the port to differentiate between
        # restricted cone and port restricted cone.
        elif req['ask'] == 'AmIRestrictedCone':
          second_port = config['local_port'] + 1000
          rsp0 = {
            'answer': 'RestrictedConePrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '54.68.84.220:80'
          }
          for i in range(5):
            sock0.sendto(json.dumps(rsp0), self.client_address)
            time.sleep(0.3)

          rsp = {
            'answer': 'RestrictedCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          for i in range(5):
            secondSocket.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)

        # For restricted-cone detection, server tell the client to prepare
        # the mapping to the ip/port that will be used to send the answer.
        # Client can choose to adjust the port to differentiate between
        # restricted cone and port restricted cone.
        elif req['ask'] == 'AmIPortRestrictedCone':
          second_port = config['local_port'] + 1000
          rsp0 = {
            'answer': 'PortRestrictedConePrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '54.68.84.220:%s' % second_port
          }
          for i in range(5):
            sock0.sendto(json.dumps(rsp0), self.client_address)
            time.sleep(0.3)

          rsp = {
            'answer': 'PortRestrictedCone',
            'reflexive_addr': '%s:%s' % self.client_address
          }
          for i in range(5):
            secondSocket.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)

        # For symmetric NAT detection, we will need a second listenning server.
        elif req['ask'] == 'AmISymmetricNAT':
          rsp0 = {
            'answer': 'SymmetricNATPrepare',
            'reflexive_addr': '%s:%s' % self.client_address,
            'prepare_peer': '54.68.84.220:7666'
          }
          sock0.sendto(json.dumps(rsp0), self.client_address)


class SymmetricUDPHandler(SocketServer.BaseRequestHandler):
    def handle(self):
        data = self.request[0].strip()
        sock0 = self.request[1]

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
            sock0.sendto(json.dumps(rsp), self.client_address)
            time.sleep(0.3)



class ThreadedUDPServer(SocketServer.ThreadingMixIn, SocketServer.UDPServer):
    pass


def start_json_server(config):
    SocketServer.ThreadingUDPServer.allow_reuse_address = True

    server = ThreadedUDPServer((config['interface0'], config['local_port']), UDPHandler)

    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread = threading.Thread(target=server.serve_forever)

    # Exit the server thread when the main thread terminates
    server_thread.daemon = True
    server_thread.start()
    print "Server loop running in thread:", server_thread.name

    server1 = ThreadedUDPServer((config['interface1'], config['local_port'] + 1000), SymmetricUDPHandler)
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

