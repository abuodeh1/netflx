docker build -t next:v1 .
docker network create lab-net
docker run -d --name next-app --network lab-net next:v1


docker build -t react:v1 .
docker run -d --name reactapp --network lab-net react:v1

docker run -dp 9000:80 --name nginx --network lab-net -v /home/ayat/docker-lab1/nginx/default.conf:/etc/nginx/config.d/default.conf nginx:1.27-alpine