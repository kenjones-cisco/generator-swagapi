FROM node:4

# to support mongoose
RUN apt-get update && apt-get install -y libkrb5-dev --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
RUN npm install --quiet -g istanbul yo gulp \
    && groupadd -g 500 -r nodejs \
    && groupadd appy \
    && useradd -m -g appy -G nodejs appy \
    && chown -R appy:nodejs /usr/local/bin \
    && chown -R appy:nodejs /usr/local/lib/node_modules \
    && mkdir -p /app \
    && chown -R appy /app

WORKDIR /app
USER appy
