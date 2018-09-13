# Raios de Chamadas Remotas

Raios de Chamadas Remotas é um projeto simples na forma cliente e servidor, que você pode disponibilizar métodos que serão executados no servidor e devolvido ao cliente em outro host por exemplo. Muito parecido com um RPC.

# Como usar?

### Definição do servidor

```js
const { RCRServer } = require('rcr');
const child_process = require('child_process');

try {
  const rcrs = new RCRServer({
    port: 40000
  });

  rcrs.registerModule('child_process', child_process);

  rcrs.listen();
} catch(error) {
  console.log("Failed on start RCRServer. %s", error);
}
```

### Definição do cliente

```js
const { RCRClient, RCRType } = require('rcr');

const rcrc = new RCRClient({
  port: 40000
});

const child_process = {
  exec: rcrc.call(RCRType.Callback, 'child_process.exec', error => console.log('child_process.exec %s', error))
};

child_process.exec('echo "Hello World"', (error, stdout, stderr) => {
  if (error) {
    error.message = `Command failed: echo "Hello World"\n${stderr}`;
    error.__proto__ = Error.prototype;
  }

  console.log('result.error %s', error);
  console.log('result.stdout', stdout);
  console.log('result.stderr', stderr);
});
```

## Read in another language
[Clique aqui e leia em português](https://github.com/supermock/rcr/blob/master/README-PT-BR.md)

## Contributions
Basta baixar o código realizar sua alteração e enviar um pull request explicando a finalidade se é um bug ou uma melhoria e etc... Após isto será analizado para ser aprovado. Observação: Caso seja uma grande alteração, abra uma issue explicando o que será feito para que você não perca seu precioso tempo desenvolvendo algo que não será utilizado. Sinta-se em casa!

## Licença

MIT