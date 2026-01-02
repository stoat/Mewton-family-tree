FROM node:20-alpine

# Install additional tools
RUN apk add --no-cache \
    git \
    curl \
    bash \
    zsh \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/bash -D node

WORKDIR /workspace

# Install pnpm for workspace management (optional but useful)
RUN npm install -g pnpm

USER node

CMD ["/bin/bash"]
