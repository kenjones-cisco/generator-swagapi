generator-swagapi
====================

Yeoman generator for swagger-based express application.

See also:

- [swaggerize-express](https://github.com/krakenjs/swaggerize-express)
- [swaggerize-routes](https://github.com/krakenjs/swaggerize-routes)
- [express](https://github.com/strongloop/express)
- [mongoose](https://github.com/Automattic/mongoose)
- [jasmine](https://github.com/jasmine/jasmine)
- [gulp](https://github.com/gulpjs/gulp)
- [eslint](https://github.com/eslint/eslint)

### Usage

Install yeoman's `yo` if you haven't already:

```
$ npm install -g yo
```

Install `generator-swagapi`:

```
$ npm install -g generator-swagapi
```

Create a project:

```
$ yo swagapi
```

### CLI Options

- `--apiPath` - specify the path to the swagger document.
- `--database` - specify the name of MongoDB instance
- `--dry-run` - show what files would be generated without making any changes

## Using Vagrant

- Install [Virtualbox](https://www.virtualbox.org/wiki/Downloads)
- Install [Vagrant](https://www.vagrantup.com/downloads.html)

Start the VM:

    vagrant up

Connect to the VM:

    vagrant ssh

After making some changes within your IDE (sync your code to VM):

    vagrant rsync

When using the docker run command below, the vagrant rsync will result in the changes being immediately available to the running container.

## Using Docker

### Why don't we just use official image directly?

The official images only provide the base installation of node and npm. To be useful you need a non-root user to install anything using `npm install -g`
otherwise you will hit the dreaded EACCESS error.

### What is included?

Each file simply adds a new user `appy` that has access to install files into the global distribution (`/usr/local/lib/node_modules`) using `npm install -g` and ownership of the application directory named `/app`. The custom group that nodejs selects on install has a group id of `500`, and is named `nodejs` within the image for easy reference and assignment to our user `appy`.

### How to use the images in development?

The run command:

    docker run -it --rm -v $(pwd):/app/generator-swagapi kenjones/generator-swagapi /bin/bash

Do not forget to include `generator-swagapi` as part of the pathname otherwise yeoman will not pick up this as a generator and all testing will fail. See next block for more information.

From the yeoman documentation:

>First, create a folder within which you'll write your generator. This folder must be named generator-name (where name is the name of your generator). This is important, as Yeoman relies on the file system to find available generators.

Basically the command will give you a command prompt within the running docker container with your current directory mounted inside at the `/app` location. Therefore when you do `npm install` the corresponding `node_modules` directory will continue to exist once you exit the container.

For more information on docker run read the following:
[https://docs.docker.com/reference/commandline/run/](https://docs.docker.com/reference/commandline/run/ "docker run")

----
Inspired by [krakenjs/generator-swaggerize](https://github.com/krakenjs/generator-swaggerize).