import { QuestionWithConditions } from "./form.models";
import { UserLinks } from "./navigation.models";
import { Match, ScoutFieldResponse, ScoutFieldSchedule, Team } from "./scouting.models";
import { User } from "./user.models";

export class LoadedStores {
    Id: number;
    User!: Date;

    constructor() {
        this.Id = 1;
        this.User = new Date();
    }
}

// Define a generic function to generate columns with a constraint
function generateColumns<T extends Record<string, any>>(instance: T): string {
    return (Object.keys(instance) as (keyof T)[]).join(',');
}

const userInstance = new User();
const userLinksInstance = new UserLinks('', '');

const teamInstance = new Team();
const matchInstance = new Match();
const scoutFieldScheduleInstance = new ScoutFieldSchedule();
const questionWithConditionsInstance = new QuestionWithConditions();
const scoutFieldResponseInstance = new ScoutFieldResponse();

const loadedStoresInstance = new LoadedStores();

export const DBStores = {
    User: {
        TableName: 'User',
        Columns: generateColumns(userInstance),
    },
    UserLinks: {
        TableName: 'UserLinks',
        Columns: generateColumns(userLinksInstance),
    },
    Team: {
        TableName: 'Team',
        Columns: generateColumns(teamInstance),
    },
    Match: {
        TableName: 'Match',
        Columns: generateColumns(matchInstance),
    },
    ScoutFieldSchedule: {
        TableName: 'ScoutFieldSchedule',
        Columns: generateColumns(scoutFieldScheduleInstance),
    },
    ScoutFieldResponse: {
        TableName: 'ScoutFieldResponse',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    ScoutFieldResponsesColumn: {
        TableName: 'ScoutFieldResponsesColumn',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    ScoutFieldResponsesResponse: {
        TableName: 'ScoutFieldResponsesResponse',
        Columns: '++id,team,rank,match'//generateColumns(scoutFieldResponseInstance),
    },
    ScoutPitResponse: {
        TableName: 'ScoutPitResponse',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    QuestionWithConditions: {
        TableName: 'QuestionWithConditions',
        Columns: generateColumns(questionWithConditionsInstance),
    },
    LoadedStores: {
        TableName: 'LoadedStores',
        Columns: generateColumns(loadedStoresInstance),
    },
};