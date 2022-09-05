declare interface IUserSignUp {
    name: IName;
    email: string;
    phone: string;
    birthday: Date;
    gender: Gender;
    password: string;
}

declare interface IName {
    firstName: string;
    lastName: string;
}
