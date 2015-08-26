## uproxy-probe

NAT diagnostics for uProxy (server-side portions only).

### server.py

Needs to run on a machine with two public IPs.

For uProxy, this is currently deployed on an Amazon EC2 instance.

### client.py

Python client for `server.py`. A TypeScript implementation, as used by uProxy,
is in [uproxy-lib](https://github.com/uProxy/uproxy-lib/blob/dev/src/nat/probe.ts).
