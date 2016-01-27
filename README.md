## uproxy-probe

NAT diagnostics for uProxy (server-side portions only).

### server.py

Needs to run on a machine with two public IPs.

For uProxy, this is currently deployed on an Amazon EC2 instance.

### client.py

Python client for `server.py`. A TypeScript implementation, as used by uProxy,
is in [uproxy-lib](https://github.com/uProxy/uproxy-lib/blob/dev/src/nat/probe.ts).

### Deploying a Server
For the NAT detection to work, a udp server is needed to aid the detection
process. `server.py` is the server code that should be run on a server with
2 public IPs. EC2 is a one enviroment to set up such a server. 

In Amazon EC2 console, create a instance from a linux image. I chose to use
`amzn-ami-hvm-2014.03.2.x86_64-ebs`. The mancine need to have 2 private ips,
each of them will be mapped to a public elastic ip. `server.cfg' needs
to be updated with the 2 private ips and 2 mapped elastic ip. A new security
group needs to be established with port 6666 and 7666 open for incoming udp. 
I also openned 80 and 22 for TCP. The latter is for ssh access. 

After that, run server.py inside screen, and test it with client.py
from your own machine. 

