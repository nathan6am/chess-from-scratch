import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

interface SearchOptions {
  minRating: number;
  maxRating: number;
  count: number;
  exclude: string[];
  themes: string[] | null;
}
@Entity()
export default class Puzzle extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  fen: string;
  @Column("text", { array: true })
  moves: string[];
  @Column()
  rating: number;
  @Column()
  ratingDeviation: number;
  @Column()
  popularity: number;
  @Column()
  nbPlays: number;
  @Column("text", { array: true })
  themes: string[];
  @Column()
  gameUrl: string;
  @Column({ nullable: true })
  openingFamily: string;
  @Column({ nullable: true })
  openingVariation: string;

  static async getPuzzles(options: SearchOptions) {}
}
