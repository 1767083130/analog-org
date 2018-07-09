# Statusbar
#
# VERSION  0.1.0

FROM hub.c.163.com/nce2/nodejs:0.12.2

ENV PORT 80

COPY . /app  
WORKDIR /app

RUN npm install

EXPOSE 80

CMD ["npm", "start"]  
