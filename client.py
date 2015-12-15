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
import fileinput
import socket

BUFSIZE = 2048

quit_prog = False

def sigint_handler(signum, frame):
  global quit_prog
  print "keyboard event received, quitting"
  quit_prog = True

# global config
config = {}

def main():
  global config
  signal.signal(signal.SIGINT, sigint_handler)

  parser = optparse.OptionParser()
  parser.add_option("-c", "--config", dest="config_filename",
                    default="client.cfg",
                    help="configuration FILE in json format.", metavar="FILE")
  parser.add_option("--remote_host", dest="remote_host", 
                    help="HOST name for client to connect to", metavar="HOST")
  parser.add_option("--remote_port", dest="remote_port", type="int",
                    help="remote PORT for this client to connect to.", metavar="PORT")

  (options, args) = parser.parse_args()

  config = json.load(open(options.config_filename))

  if options.remote_port is not None:
    config['remote_port'] = options.remote_port  
  if options.remote_host is not None:
    config['remote_host'] = options.host

  client = NatDetectClient(config)
  client.perform_job()
  client.quit_thread()


class ReceivingThread(threading.Thread):
  def __init__(self, sock, rsp_queue):
    super(ReceivingThread, self).__init__()
    self.socket = sock
    self.quit = False
    self.rsp_queue = rsp_queue
  
  def run(self):
    while not self.quit and not quit_prog:
      ready = select.select([self.socket], [], [], 3)
      if ready[0]:
        rsp, fromaddr = self.socket.recvfrom(BUFSIZE)
        self.rsp_queue.append(json.loads(rsp))


class NatDetectClient:
  '''The client side implementation of NAT detection, running in user env.'''

  def __init__(self, config):
    self.config = config

  def perform_job(self):
    self.addr = config['remote_host'], config['remote_port']
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    self.sock.bind(('', 0))
    self.sock.setblocking(0)
    self.response_queue = []

    # set a thread to receive udp packet and push them to a queue.
    self.recv_thread = ReceivingThread(self.sock, self.response_queue)
    self.recv_thread.start()

    if self.config['nat_type_query']:
      self.do_nat_type_query()
    else:
      # this is really for debugging purpose. You can push anything to server.
      for line in fileinput.input():
        req += line;
      print 'request sent to %s:%s' % addr
      self.sock.sendto(req, addr)

  def quit_thread(self):
    self.recv_thread.quit = True
    self.recv_thread.join()

  def do_nat_type_query(self):
    print 'Am I full cone?'
    req = {
      'ask': 'AmIFullCone',
    }
    for i in range(10):
      self.sock.sendto(json.dumps(req), self.addr)
      time.sleep(0.3)
      if self.response_queue:
        rsp = self.response_queue.pop()
        print str(rsp)
        if rsp['answer'] == 'FullCone':
          print '!!! Your NAT is full-cone type'
          return

    print 'Am I restricted cone?'
    req = {
      'ask': 'AmIRestrictedCone'
    }
    for i in range(10):
      self.sock.sendto(json.dumps(req), self.addr)
      time.sleep(0.3)
      if self.response_queue:
        rsp = self.response_queue.pop()
        if rsp['answer'] == 'RestrictedConePrepare':
          peer_addr = rsp['prepare_peer'].split(':')
          self.sock.sendto('{"ask":""}', (peer_addr[0], int(peer_addr[1]) + 1))

        elif rsp['answer'] == 'RestrictedCone':
          print '!!! Your NAT is restricted-cone type'
          return

    print 'Am I port restricted cone?'
    req = {
      'ask': 'AmIPortRestrictedCone'
    }
    for i in range(20):
      self.sock.sendto(json.dumps(req), self.addr)
      time.sleep(0.3)
      if self.response_queue:
        rsp = self.response_queue.pop()
        if rsp['answer'] == 'PortRestrictedConePrepare':
          peer_addr = rsp['prepare_peer'].split(':')
          self.sock.sendto('{"ask":""}', (peer_addr[0], int(peer_addr[1])))

        elif rsp['answer'] == 'PortRestrictedCone':
          print '!!! Your NAT is port restricted-cone type'
          return

    print 'Am I symmetric NAT?'
    req = {
      'ask': 'AmISymmetricNAT'
    }
    for i in range(10):
      self.sock.sendto(json.dumps(req), self.addr)
      time.sleep(0.3)
      while self.response_queue:
        rsp = self.response_queue.pop()
        if rsp['answer'] == 'SymmetricNATPrepare':
          peer_addr = rsp['prepare_peer'].split(':')
          reflexive_addr1 = rsp['reflexive_addr']
          self.sock.sendto(json.dumps(req), (peer_addr[0], int(peer_addr[1])))
        elif rsp['answer'] == 'SymmetricNAT':
          reflexive_addr2 = rsp['reflexive_addr']
          print '!!! Your NAT is symmetric type, 2 reflexive addresses seen'
          print '%s vs %s' % (reflexive_addr1, reflexive_addr2)
          return


if __name__ == '__main__':
  main()

