#!/bin/sh

npm install
npm run build
serverless deploy
