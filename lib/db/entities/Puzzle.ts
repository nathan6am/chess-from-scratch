import { BaseEntity, Entity, PrimaryColumn, PrimaryGeneratedColumn, Column } from "typeorm";

interface SearchOptions {
  minRating: number;
  maxRating: number;
  sampleSize: number;
  excludeIds: string[] | null;
  themes: string[] | null;
}

@Entity()
export default class Puzzle extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  fen: string;
  @Column()
  moves: string;
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

  static async getPuzzles(options: Partial<SearchOptions>) {
    const defaultOptions: SearchOptions = {
      minRating: 0,
      maxRating: 4000,
      sampleSize: 25,
      excludeIds: null,
      themes: null,
    };
    const searchOptions = { ...defaultOptions, ...options };
    const { minRating, maxRating, sampleSize, excludeIds, themes } = searchOptions;
    let query = Puzzle.createQueryBuilder()
      .select()
      .where("rating BETWEEN :minRating AND :maxRating", { minRating, maxRating });
    if (themes) {
      query = query.andWhere("themes && :selectedThemes", { selectedThemes: themes });
    }
    if (excludeIds) {
      query = query.andWhere("id NOT IN (:...excludeIds)", { excludeIds });
    }
    query = query.orderBy("RANDOM()").limit(sampleSize);
    return await query.getMany();
  }
}
