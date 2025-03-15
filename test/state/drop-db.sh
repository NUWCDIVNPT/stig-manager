#!/usr/bin/bash

sudo iptables $1 OUTPUT -p tcp -m tcp --sport 50001 -s 127.0.0.1 -j DROP