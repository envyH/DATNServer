FROM node:lts-alpine
ENV NODE_ENV=.env
WORKDIR /usr/src/app
# Copy all the files from your file system to the container file system
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# Install all dependencies
RUN npm install --production --silent && mv node_modules ../
# Copy other files as well
COPY . .
# Expose the port
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
# Command to execute when the image is instantiated
CMD ["npm", "start"]
