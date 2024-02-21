const crypto = require("crypto");

class Game {
  constructor(moves) {
    this.moves = moves;
    this.moveTable = this.generateMoveTable();
  }

  generateMoveTable() {
    const moveTable = Array.from({ length: this.moves.length }, () =>
      Array.from({ length: this.moves.length }, () => "Draw")
    );

    for (let i = 0; i < this.moves.length; i++) {
      for (let j = i + 1; j < this.moves.length; j++) {
        if ((j - i) % 2 === 1) {
          moveTable[i][j] = "Win";
          moveTable[j][i] = "Lose";
        } else {
          moveTable[i][j] = "Lose";
          moveTable[j][i] = "Win";
        }
      }
    }

    return moveTable;
  }

  displayMoveTable() {
    const maxWidth = Math.max(...this.moves.map((move) => move.length));
    const columnWidth = maxWidth + 2;

    const header =
      "+--------------+" +
      this.moves.map((move) => "-".repeat(columnWidth)).join("---") +
      "+";
    const separator =
      "+--------------+" +
      this.moves.map((move) => "-".repeat(columnWidth)).join("---") +
      "+";

    console.log(header);
    console.log(
      `| v PC\\User > | ${this.moves
        .map((move) => move.padEnd(columnWidth))
        .join("|")}|`
    );
    console.log(separator);

    for (let i = 0; i < this.moves.length; i++) {
      const row = `${this.moves[i].padEnd(14)}|`;
      const cells = this.moveTable[i]
        .map((outcome) => outcome.padEnd(columnWidth - 1))
        .join("|");
      console.log(`| ${row} ${cells}|`);
      console.log(separator);
    }
  }
}

class RockPaperScissors {
  constructor(moves, game) {
    this.moves = moves;
    this.moveTable = game.moveTable;
  }

  generateKey() {
    return crypto.randomBytes(32).toString("hex"); // 256 bits
  }

  computerMove() {
    return this.moves[Math.floor(Math.random() * this.moves.length)];
  }

  calculateWinner(userMoveIndex, computerMoveIndex) {
    const userMove = this.moves[userMoveIndex];
    const computerMove = this.moves[computerMoveIndex];

    if (userMoveIndex === computerMoveIndex) {
      return "Draw";
    } else if (this.moveTable[computerMoveIndex][userMoveIndex] === "Win") {
      return "Win";
    } else {
      return "Lose";
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (
    args.length < 3 ||
    new Set(args).size % 2 === 0 ||
    new Set(args).size < 3
  ) {
    console.log(
      "Error: You must provide an odd number of unique moves (>=3) as command line arguments."
    );
    console.log("Example: node game.js rock paper scissors");
    return;
  }

  const game = new Game(args);
  const rpcGame = new RockPaperScissors(args, game);
  const key = rpcGame.generateKey();

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const validMoveIndexes = args.map((_, index) => (index + 1).toString());
  const validInputs = [...validMoveIndexes, "0", "?"];

  const askMove = () => {
    const computerMove = rpcGame.computerMove();
    const hmac = crypto
      .createHmac("sha256", key)
      .update(computerMove)
      .digest("hex");

    console.log(`\n\nHMAC: ${hmac}`);
    console.log("\nAvailable moves:");
    args.forEach((move, index) => console.log(`${index + 1} - ${move}`));
    console.log("0 - Exit");
    console.log("? - Help");

    readline.question("Enter your move: ", (moveIndex) => {
      if (!validInputs.includes(moveIndex)) {
        console.log("Invalid input. Please enter a valid move index.");
        askMove();
        return;
      }

      if (moveIndex === "0") {
        console.log("Goodbye!");
        readline.close();
        return;
      } else if (moveIndex === "?") {
        game.displayMoveTable();
        askMove();
        return;
      }

      const userMoveIndex = parseInt(moveIndex) - 1;
      const userMove = args[userMoveIndex];
      console.log(`\nYour move: ${userMove}`);
      console.log(`Computer move: ${computerMove}`);
      console.log(
        `Winner: ${rpcGame.calculateWinner(
          userMoveIndex,
          args.indexOf(computerMove)
        )}`
      );
      console.log(`HMAC Key: ${key}`);

      askMove();
    });
  };

  askMove();
}

main();
