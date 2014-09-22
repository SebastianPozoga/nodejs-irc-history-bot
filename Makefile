all: npm-install

npm-install:
	npm install

run:
	nodejs main.js

ubuntu-install:
	sudo apt-get install nodejs npm