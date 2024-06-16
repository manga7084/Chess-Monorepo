import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE, REJOIN_GAME } from "./messages";
import db from "@repo/db";
export class GameManager {
  private games: Game[];
  private users: WebSocket[];
  private pendingUser: WebSocket | null;
  // private gameId: string | null;
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
    // this.gameId = gameId;
  }
  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }
  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
  }
  private addHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          const game = new Game(this.pendingUser, socket);
          this.games.push(game);
          this.pendingUser = null;
          db.game.create({
            data: {
              whitePlayerId: "player1",
              blackPlayerId: "player2",
              status: "IN_PROGRESS",
              result: null,
              timeControl: "CLASSICAL",
              startingFen: game.board.fen(),
              currentFen: game.board.fen(),
            },
          });
        } else {
          this.pendingUser = socket;
        }
      }
      // if (message.type === REJOIN_GAME) {
      // }
      if (message.type === MOVE) {
        const game = this.games.find(
          (game) => game.player1 === socket || game.player2 == socket
        );
        if (game) {
          game.makeMove(socket, message.move);
        }
      }
    });
  }

  // async handleRejoin(socket: WebSocket, gameId: string) {
  //   try {
  //     const gameDetails = await db.get({
  //       where: {
  //         id: this.gameId,
  //       },
  //     });
  //     if (gameDetails.player1.readyState === WebSocket.CLOSED) {
  //       const reGame = this.games.find(
  //         (game) => game.player1 === gameDetails.player1
  //       );
  //       if (reGame) {
  //         reGame.player1 = socket;
  //       }
  //       const prevMoves = await db.get({
  //         where: {
  //           gameId: gameId,
  //         },
  //       });
  //     }
  //   } catch (e) {
  //     console.log("some db error occurred", e);
  //   }
  // }
}
