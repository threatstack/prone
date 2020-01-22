FROM node:10
# FROM node:8
# FROM node:12

RUN mkdir /usr/src/prone
RUN mkdir /tmp/extracted_files
COPY . /usr/src/prone
WORKDIR /usr/src/prone

RUN rm -rf node_modules/
RUN npm install
RUN npm install https://pkg.threatstack.com/appsec/node/bluefyre-agent-node-latest.tgz

EXPOSE 3001
EXPOSE 9229
ENTRYPOINT ["npm", "run", "start-load"]
