import { IQuestion, IQuestionWithConditions, QuestionWithConditions } from "./form.models";

export class Team {
    team_no!: number;
    team_nm!: string;
    void_ind = 'n'
    checked = false;
}

export interface IScoutQuestion {
    id: number;
    question_id: number;
    season_id: number;
    scorable: boolean;
    void_ind: string;
}

export class ScoutQuestion implements IScoutQuestion {
    id!: number;
    question_id!: number;
    season_id!: number;
    scorable = false;
    void_ind = 'n';
}

export interface IScoutFieldResponse {
    question_answers: IQuestionWithConditions[];
    team: number;
    match_id: string | null;
    form_typ: string;
}

export class ScoutFieldResponse implements IScoutFieldResponse {
    question_answers: QuestionWithConditions[] = [];
    team!: number;
    match_id!: string | null;
    form_typ = 'field';
}

export interface IScoutPitResponse {
    question_answers: IQuestionWithConditions[];
    team: number;
    response_id: number | null;
    form_typ: string;
}

export class ScoutPitResponse implements IScoutPitResponse {
    question_answers: QuestionWithConditions[] = [];
    team!: number;
    response_id!: number | null;
    form_typ = 'field';
}