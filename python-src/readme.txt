In this directory there are 2 python files and their corresponding config files. "jsonserv.py" 
is suppose to run on a server. It is currently deployed in a EC2 instance, "jsonserv.cfg" has
the configuration for this deployment. It should serve as an example for future deployment in
other platform. "jsonserv.py" has comment to explain what is required. 

"jsonclient.py" can be used by itself to run on testing environment. In our perceived usage,
this role is performed by ChromeApp in Javascript code. I mainly use this file for development
and testing. The configuration is also done for existing EC2 deployment. 
 
