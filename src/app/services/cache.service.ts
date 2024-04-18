import { Injectable } from '@angular/core';
import { DexieCrud } from '../classes/dexie-crud';
import { IMatch, IScoutFieldResponse, IScoutFieldSchedule, IScoutPitResponse, ITeam } from '../models/scouting.models';
import { AppDatabaseService } from './app-database.service';
import { IUser } from '../models/user.models';
import { LoadedStores } from '../models/idb.store.model';
import { IUserLinks } from '../models/navigation.models';
import { IQuestionWithConditions } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  User!: DexieCrud<IUser, number>;
  UserLinks!: DexieCrud<IUserLinks, number>;

  Team!: DexieCrud<ITeam, number>;
  Match!: DexieCrud<IMatch, string>;
  ScoutFieldSchedule!: DexieCrud<IScoutFieldSchedule, number>;
  ScoutFieldResponse!: DexieCrud<IScoutFieldResponse, number>;
  // These are used for the responses page
  ScoutFieldResponsesColumn!: DexieCrud<any, number>;
  ScoutFieldResponsesResponse!: DexieCrud<any, number>;

  ScoutPitResponse!: DexieCrud<IScoutPitResponse, number>;

  QuestionWithConditions!: DexieCrud<IQuestionWithConditions, number>;

  LoadedStores!: DexieCrud<LoadedStores, number>;

  constructor(private appDB: AppDatabaseService) {
    this.User = new DexieCrud<IUser, number>(this.appDB.UserTable);
    this.UserLinks = new DexieCrud<IUserLinks, number>(this.appDB.UserLinksTable);

    this.Team = new DexieCrud<ITeam, number>(this.appDB.TeamTable);
    this.Match = new DexieCrud<IMatch, string>(this.appDB.MatchTable);
    this.ScoutFieldSchedule = new DexieCrud<IScoutFieldSchedule, number>(this.appDB.ScoutFieldScheduleTable);
    this.ScoutFieldResponse = new DexieCrud<IScoutFieldResponse, number>(this.appDB.ScoutFieldResponseTable);
    this.ScoutFieldResponsesColumn = new DexieCrud<object, number>(this.appDB.ScoutFieldResponsesColumnTable);
    this.ScoutFieldResponsesResponse = new DexieCrud<object, number>(this.appDB.ScoutFieldResponsesResponseTable);

    this.ScoutPitResponse = new DexieCrud<IScoutPitResponse, number>(this.appDB.ScoutPitResponseTable);

    this.QuestionWithConditions = new DexieCrud<IQuestionWithConditions, number>(this.appDB.QuestionWithConditionsTable);

    this.LoadedStores = new DexieCrud<LoadedStores, number>(this.appDB.LoadedStoresTable);
  }
}
