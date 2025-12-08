#!/bin/bash

echo "Building Backend..."
cd Backend
mvn clean package -DskipTests
cd ..

echo "Building Docker Images..."
docker build -t harshwarbhe/revticket-backend:latest -f Backend/Dockerfile Backend/
docker build -t harshwarbhe/revticket-frontend:latest -f Frontend/Dockerfile Frontend/

echo "Pushing to Docker Hub..."
docker push harshwarbhe/revticket-backend:latest
docker push harshwarbhe/revticket-frontend:latest

echo "Deploy complete! Now run on AWS EC2:"
echo "docker-compose -f docker-compose.ec2.yml pull"
echo "docker-compose -f docker-compose.ec2.yml up -d"
