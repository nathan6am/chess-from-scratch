import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import type { Color, Rating, RatingCategory } from "../../chess";
import type { Relation } from "typeorm";
import User from "./User";
import Game from "./Game";

interface SearchOptions {
  opponentId?: string;
  before?: Date;
  after?: Date;
  asColor?: Color;
  result?: Array<"win" | "loss" | "draw">;
  ratingCategory?: RatingCategory[];
  sortBy?: "date" | "rating" | "opponentRating";
  sortDirection?: "ASC" | "DESC";
  limit?: number;
}

@Entity()
export default class User_Game extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: "game_id", referencedColumnName: "id" })
  game: Relation<Game>;

  @Column({ type: "text" })
  color: Color;

  @Column({ type: "text" })
  result: "win" | "loss" | "draw";

  @Column()
  ratingCategory: RatingCategory;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  opponentRating: number;

  @Column({ nullable: true })
  opponentId: string;

  static async findGamesByUser(userid: string, searchOptions: SearchOptions) {
    const query = this.createQueryBuilder("user_game")
      .leftJoinAndSelect("user_game.game", "game")
      .leftJoin("game.players", "players")
      .leftJoin("players.user", "user")
      .where("user_game.user_id = :userid", { userid });
    if (searchOptions.opponentId) {
      query.andWhere("user_game.opponent_id = :opponentId", { opponentId: searchOptions.opponentId });
    }
    if (searchOptions.before) {
      query.andWhere("game.date < :before", { before: searchOptions.before });
    }
    if (searchOptions.after) {
      query.andWhere("game.date > :after", { after: searchOptions.after });
    }
    if (searchOptions.asColor) {
      query.andWhere("user_game.color = :color", { color: searchOptions.asColor });
    }
    if (searchOptions.result) {
      query.andWhere("user_game.result = ANY(:result)", { result: searchOptions.result });
    }
    if (searchOptions.ratingCategory) {
      query.andWhere("user_game.rating_category = ANY(:ratingCategory)", {
        ratingCategory: searchOptions.ratingCategory,
      });
    }
    if (searchOptions.sortBy) {
      query.orderBy(`game.${searchOptions.sortBy}`, searchOptions.sortDirection || "DESC");
    }

    query.select(["user_game", "game", "players", "user.id", "user.username"]);
    if (searchOptions.limit) {
      query.limit(searchOptions.limit);
    }
    const games = await query.getMany();
    return games;
  }
}
