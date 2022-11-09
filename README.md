# A Bitails API JS Wrapper library for Bitcoin SV Developer


https://bitails.net/

## Documentation

https://docs.bitails.net/


The Swagger is available for both main net and test net.

Main net: https://api.bitails.net/swagger

Test net: https://test-api.bitails.net/swagger



## Install

---

```javascript
npm install git+https://github.com/samooth/bitails
```

## Sample Usage

Check out these [test code](https://github.com/samooth/bitails/tree/master/test) in JavaScript and TypeScript to get up and running quickly.

## History

### 0.2.0
- Support Cache, default is true. if you don't want cache, set option `{ enableCache: false }`
- Support ApiKey and rate limit to 3 requests/sec without apiKey.
```
  // with apiKey
  const explorer = new Bitails( 'testnet', { apiKey: 'your api key'}  )
```
```
  // without apiKey
  const explorer = new Bitails( 'testnet' )
```
- Support JSDoc type check.

### 0.1.0
- Initate, Support all API in document.

# License

It is released under the terms of the Open BSV license.
