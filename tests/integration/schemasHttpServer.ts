import * as http from "http";
import {IncomingMessage, ServerResponse} from "http";
import * as fs from "fs";
import path from "path";

export function createSchemasHttpServer(port: number): http.Server<typeof IncomingMessage, typeof ServerResponse> {
    const srv = http.createServer(function (request, response) {
        if (!request.url) {
            response.writeHead(404)
        }
        let filePath = path.join('./tests/integration/data/schemas/' + request.url);

        fs.readFile(filePath, function(error, content) {
            if (error) {
                if (error.code == 'ENOENT'){
                    response.writeHead(404);
                    response.end("not found");
                }
                else {
                    response.writeHead(500);
                    response.end('server error');
                }
            } else {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(content, 'utf-8');
            }
        });
    })
    srv.listen(port)
    return srv
}

