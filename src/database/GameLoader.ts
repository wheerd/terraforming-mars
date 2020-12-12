
import {Color} from '../Color';
import {Database} from './Database';
import {Game} from '../Game';
import {Player} from '../Player';

export class GameLoader {
    private started = false;

    private readonly games = new Map<string, Game>();
    private readonly pendingGame = new Map<string, Array<(game: Game | undefined) => void>>();
    private readonly pendingPlayer = new Map<string, Array<(game: Game | undefined) => void>>();
    private readonly playerToGame = new Map<string, Game>();

    private readonly knownGameIds = new Set<string>();
    private readonly knownPlayerIds = new Map<string, string>();

    public start(cb = () => {}): void {
      if (this.started === true) {
        throw new Error('already started!');
      }
      this.loadAllGames(cb);
    }

    public addGame(game: Game): void {
      this.games.set(game.id, game);
      this.knownGameIds.add(game.id);
      for (const player of game.getPlayers()) {
        this.playerToGame.set(player.id, game);
        this.knownPlayerIds.set(player.id, game.id);
      }
    }

    public getLoadedGameIds(): Array<string> {
      return Array.from(this.games.keys());
    }

    public getGameByGameId(gameId: string, cb: (game: Game | undefined) => void): void {
      // waiting to start
      if (this.started === false) {
        const pendingGame = this.pendingGame.get(gameId);
        if (pendingGame !== undefined) {
          pendingGame.push(cb);
        } else {
          this.pendingGame.set(gameId, [cb]);
        }
      } else if (this.games.has(gameId)) {
        cb(this.games.get(gameId));
      } else if (this.knownGameIds.has(gameId)) {
        this.loadGameIntoMemory(gameId, cb);
      } else {
        cb(undefined);
      }
    }

    private loadGameIntoMemory(gameId: string, cb: (game: Game | undefined) => void): void {
      if (this.knownGameIds.has(gameId) === false) {
        console.warn(`GameLoader:game id not found ${gameId}`);
        cb(undefined);
      } else {
        const player = new Player('test', Color.BLUE, false, 0);
        const player2 = new Player('test2', Color.RED, false, 0);
        const gameToRebuild = new Game(gameId, [player, player2], player);
        Database.getInstance().getGame(gameId, (err: any, serializedGame?) => {
          if (err || serializedGame === undefined) {
            console.error('GameLoader:loadGameIntoMemory', err);
            cb(undefined);
            return;
          }
          try {
            gameToRebuild.loadFromJSON(serializedGame);
            this.addGame(gameToRebuild);
            console.log(`GameLoader loaded game ${gameId} into memory from database`);
            cb(gameToRebuild);
          } catch (e) {
            console.error('GameLoader:loadGameIntoMemory', err);
            cb(undefined);
          }
        });
      }
    }

    private loadPlayerIntoMemory(playerId: string, cb: (game: Game | undefined) => void): void {
      const gameId = this.knownPlayerIds.get(playerId);
      if (gameId !== undefined) {
        this.loadGameIntoMemory(gameId, cb);
      } else {
        console.warn(`GameLoader:player id not found ${playerId}`);
        cb(undefined);
      }
    }

    public getGameByPlayerId(playerId: string, cb: (game: Game | undefined) => void): void {
      if (this.started === false) {
        const pendingPlayer = this.pendingPlayer.get(playerId);
        if (pendingPlayer !== undefined) {
          pendingPlayer.push(cb);
        } else {
          this.pendingPlayer.set(playerId, [cb]);
        }
      } else if (this.playerToGame.has(playerId)) {
        cb(this.playerToGame.get(playerId));
      } else if (this.knownPlayerIds.has(playerId)) {
        this.loadPlayerIntoMemory(playerId, cb);
      } else {
        cb(undefined);
      }
    }

    private onAllGamesLoaded(): void {
      this.started = true;
      // any pendingPlayer or pendingGame callbacks
      // are waiting for player or games, since
      // we now have every game id and player id
      // in database load any that have been requested
      this.pendingGame.forEach((cbs, gameId) => {
        this.loadGameIntoMemory(gameId, (game) => {
          cbs.forEach((cb) => {
            cb(game);
          });
        });
      });
      this.pendingPlayer.forEach((cbs, playerId) => {
        this.loadPlayerIntoMemory(playerId, (game) => {
          cbs.forEach((cb) => {
            cb(game);
          });
        });
      });
      this.pendingGame.clear();
      this.pendingPlayer.clear();
    }

    private loadAllGames(cb = () => {}): void {
      Database.getInstance().getGames((err, allGames) => {
        if (err) {
          console.error('error loading all games', err);
          this.onAllGamesLoaded();
          cb();
          return;
        }

        if (allGames.length === 0) {
          this.onAllGamesLoaded();
          cb();
        };

        let loaded = 0;
        allGames.forEach((game_id) => {
          Database.getInstance().getGame(
            game_id,
            (err, game) => {
              loaded++;
              if (err || game === undefined) {
                console.error(`unable to load game ${game_id}`, err);
              } else {
                console.log(`load game ${game_id}`);
                this.knownGameIds.add(game_id);
                for (const player of game.players) {
                  this.knownPlayerIds.set(player.id, game_id);
                }
                if (loaded === allGames.length) {
                  this.onAllGamesLoaded();
                  cb();
                }
              }
            });
        });
      });
    }
}
