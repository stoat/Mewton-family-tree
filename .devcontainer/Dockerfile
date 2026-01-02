FROM node:20-alpine

# Install additional tools
RUN apk add --no-cache \
    git \
    curl \
    bash \
    zsh \
    build-base \
    python3

WORKDIR /workspace

# Install npm latest and pnpm for workspace management
RUN npm install -g npm@latest pnpm

USER node

CMD ["/bin/bash"]
