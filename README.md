# Prone - Threat Stack's vulnerable demo app

A vulnerable Node.js demo application, based on the [Dreamers Lab tutorial](http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/).

## Features

This vulnerable app includes the following capabilities to experiment with:
* [Exploitable packages](#exploiting-the-vulnerabilities) with known vulnerabilities
* [Runtime alerts](#runtime-alerts) for detecting an invocation of vulnerable functions in open source dependencies

## Setup
Sign up at the ThreatStack portal and create a Project and obtain an AGENT_ID

## Running in Docker
Update the  `docker-compose.yml` file with the AGENT_ID from the previous step
```
BLUEFYRE_AGENT_ID
```

Now in a terminal, run the following
```bash
docker-compose up
```
This will run two containers (the Prone app with the agent and a mongodb container) listening on port 3001 (http://localhost:3001)

## Running standalone
```bash
mongod &

git clone git@gitlab.com:bluefyre/sampleapps/prone.git
npm install
npm start
```
This will run Prone locally, using a local mongo on the default port and listening on port 3001 (http://localhost:3001)

## Running with systemd
```bash
sudo mv prone.service /etc/systemd/system
sudo systemctl enable prone
sudo systemctl start prone
sudo systemctl status prone
```

## Running with docker-compose
```bash
docker-compose up --build
docker-compose down
```
ensure you update `docker-compose.yaml` with your agent ID

## Setting up Nginx
```bash
echo "# prone

upstream prone {
    server localhost:3001;
}

server {
  listen 80;
  listen [::]:80;

  server_name prone.local prone.demo prone.demo.io;

  location /testing {
    fastcgi_pass unix:/does/not/exist;
  }

  error_page 500 /error_500.html;
  location = /error_500.html {
    root /opt/sampleapps/prone/errorpages;
  }
  location = /logo.png {
    root /opt/sampleapps/prone/errorpages;
  }

  location / {
    proxy_set_header X-Real-Ip $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_set_header REMOTE_ADDR $remote_addr;

    proxy_pass http://prone;
    proxy_intercept_errors on;
    error_page 500 /error_500.html;


  }

  client_max_body_size 20M;

}"  | sudo tee /etc/nginx/sites-available/prone.conf
sudo ln -s /etc/nginx/sites-available/prone.conf /etc/nginx/sites-enabled/prone.conf
sudo systemctl status nginx
sudo systemctl restart nginx
```


### Heroku usage
Prone requires attaching a MongoLab service to be deployed as a Heroku app. 
That sets up the MONGOLAB_URI env var so everything after should just work. 

### CloudFoundry usage
Prone requires attaching a MongoLab service and naming it "prone-mongo" to be deployed on CloudFoundry. 
The code explicitly looks for credentials to that service. 

### Cleanup
To bulk delete the current list of TODO items from the DB run:
```bash
npm run cleanup
```

## Triggering attack blocking via the Prone UI
By navigating to http://localhost:3001/, you can use the Prone app and add todo items.
Just copy/paste one of the below samples to trigger attacks:
```javascript
// this sample will trigger an SQL injection
"; DROP TABLE users
```
```javascript
// this one will trigger an XSS attack
<script>alert(1);</script>
```

## Triggering attack blocking via curl requests
Assuming the app is running on the default host and port (localhost:3001) and that Live Protect is on, the following curl requests will be blocked:
```bash
# this command will trigger an SQL injection
curl -X POST http://localhost:3001/create -H 'Content-Type: application/json' -d '{"content": "\"; DROP TABLE users"}'
```
```bash
# this command will trigger an XSS attack
curl -X POST http://localhost:3001/create -H 'Content-Type: application/json' -d '{"content": "<script>alert(1);</script>"}'
```

## Exploiting the eval vulnerability
Assuming the app is running on the default host and port (localhost:3001):
```bash
# this command will print all the env vars on the server
curl -X GET http://localhost:3001/api/todo/eval?content=JSON.stringify(process.env)
```
Ref: https://ibreak.software/2016/08/nodejs-rce-and-a-simple-reverse-shell/

## Connecting to Threat Stack App Sec

### Compatibility and Requirements
Before you install the Node.js microagent, make sure your application meets the following system requirements:

- Node.js version 6 or higher
- NPM version 5 or higher
- Python version 2 or 3

### Creating an Account and Logging In
Go to the main portal page at https://appsec.dev.threatstack.net to create your account using your email address and specify a password. You will immediately be able to log-in. "Forgot Password" functionality is available if a password reset is needed. 

### Creating a Project
Create a new project by selecting "Projects" from the left navigation bar and then click on "create." Name your project and select which language it uses (for this Preview Release, Node.js is the only option available), then click "save." On the next screen, you can add a brief description of the project and apply tags to help organize your projects. Click "save" and then select "Projects" again from the left navigation bar to return to the projects list. 

### Creating a Microagent ID
Access the project's Agents page either by clicking the Agents button for that project on the main project page, or by clicking the "Agents reporting" tile from the project's home page. Then click the "New Agent" button on the top right corner of the screen. Enter a name for the agent and click "OK" to create the agent. You can access the new agent's details by clicking "edit" from the agents page.

### Adding the Microagent to your Node Project
You need to download and install the the monitoring microagent agent to your application and then link it to the agent ID that you created back in the web portal.

Download the microagent from the portal by clicking "Download" on the left nav bar. 

On the developer's machine, navigate to your Node application and use NPM to install the agent. 

```cd /prone
wget https://bluefyre.blob.core.windows.net/releases/bluefyre-agent-node-x.x.x.tgz
npm install ./bluefyre-agent-node-x.x.x.tgz
```
import the agent to the top of `app.js`
```
var agent = require('bluefyre-agent-node')
```
You can associate the agent ID with the application via an environment variable. This can be passed on the command line when you start the application.
```
BLUEFYRE_AGENT_ID="YOUR_AGENT_ID_GOES_HERE" npm start
```
alternativly, add a bluefyre.json file
```
{
    "agent_id": "YOUR_AGENT_ID"
}
```

## Attribution
Inspired by the open source Goof app by [Snyk](snyk.io) available [here](https://github.com/snyk/goof)
