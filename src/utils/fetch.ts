import https, { Agent, type AgentOptions, type RequestOptions } from 'node:https'
import fs, { type PathLike } from 'node:fs'

export function fetch(options: RequestOptions, path: PathLike, proxy?: AgentOptions) {
  return new Promise((res, rej) => {
    if (proxy) {
      options.agent = new Agent(proxy)
		}

		https
			.get(options, response => {
				const code = response.statusCode;
        if (code) {
          if (code >= 400) {
            // 资源不存在
            rej({ code, message: response.statusMessage });
          } else if (code >= 300) {
            // 资源重定向
            options.path = response.headers?.location || '/';
            fetch(options, path, proxy).then(res, rej);
          } else {
            response
              .pipe(fs.createWriteStream(path))
              .once('finish', res)
              .once('error', rej);
          }
        }
			})
			.once('error', rej);
  })
}