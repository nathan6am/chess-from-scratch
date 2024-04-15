import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import type { Color, Rating, RatingCategory } from "../../chess";
import type { Relation } from "typeorm";
import User from "./User";
import Game from "./Game";

export interface GameSearchOptions {
  opponentId?: string;
  before?: Date;
  after?: Date;
  asColor?: Color | "any";
  result?: Array<"win" | "loss" | "draw">;
  ratingCategory?: RatingCategory[];
  sortBy?: "date" | "rating" | "opponentRating";
  sortDirection?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
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

  static async findGamesByUser(userid: string, searchOptions: GameSearchOptions) {
    const page = searchOptions.page || 1;
    const pageSize = searchOptions.pageSize || 12;
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
    if (searchOptions.asColor && searchOptions.asColor !== "any") {
      query.andWhere("user_game.color = :color", { color: searchOptions.asColor });
    }
    if (searchOptions.result) {
      query.andWhere("user_game.result = ANY(:result)", { result: searchOptions.result });
    }
    if (searchOptions.ratingCategory) {
      query.andWhere("user_game.ratingCategory = ANY(:ratingCategory)", {
        ratingCategory: searchOptions.ratingCategory,
      });
    }
    if (searchOptions.sortBy) {
      query.orderBy(`game.${searchOptions.sortBy || "date"}`, searchOptions.sortDirection || "DESC");
    } else {
      query.orderBy("game.date", "DESC");
    }

    query.select(["user_game", "game", "players", "user.id", "user.username"]);
    query.skip((page - 1) * pageSize);
    query.take(pageSize);
    const games = await query.getMany();
    return games;
  }

  static async getRatingHistory(userid: string, ratingCategory: RatingCategory, from?: Date) {
    let query = this.createQueryBuilder("user_game")
      .select(["user_game.rating", "game.date"])
      .leftJoin("user_game.game", "game")
      .where("user_game.user_id = :userid", { userid })
      .andWhere("user_game.ratingCategory = :ratingCategory", { ratingCategory });
    if (from) {
      query = query.andWhere("game.date > :from", { from });
    }
    query = query.orderBy("game.date", "ASC");
    const games = await query.getMany();
    return games.map((g) => ({ rating: g.rating, date: g.game.date }));
  }
}
