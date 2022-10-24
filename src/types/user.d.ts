declare interface IUserSignUp {
    name: IName;
    email: string;
    phone: string;
    birthday: string;
    gender: Gender;
    password: string;
}

declare interface IName {
    firstName: string;
    lastName: string;
}

declare interface IAlbum {
    publicId: string;
    visibleFor: 'public' | 'friends' | 'only me';
}
