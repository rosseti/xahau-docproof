# Project Overview

This repository contains the source code for a full-stack application that utilizes a combination of technologies to provide a seamless user experience. The project consists of four main directories:

### Docker

This directory contains the necessary Docker containers to set up and run the project. The containers provide a consistent and isolated environment for the application to run in.

### API

The API directory contains the Node.js application built using the Express framework. This layer handles incoming requests and provides data to the frontend.

### XApp

The XApp directory contains the Next.js application responsible for interacting with the user. This layer provides a responsive and dynamic user interface.

### Hooks

The Hooks directory contains the C source code for the smart contract deployed on the Xahau network. This contract enables secure and decentralized interactions between the application and the blockchain.

## Getting Started

To get started with the project, navigate to the Docker directory and follow the instructions to set up the containers. Once the containers are running, you can access the application through the XApp directory.

## Technology Stack

* Node.js (API)
* Express (API)
* Next.js (XApp)
* C (Smart Contract)
* Docker (Containerization)

## Directory Structure

* `docker/`: Docker containers for the project
* `hooks/`: C source code for the smart contract on Xahau network
* `api/`: Node.js API using Express
* `xapp/`: Next.js application for user interaction
