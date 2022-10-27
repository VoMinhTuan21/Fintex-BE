export class ParticipantResDto {
    _id: string;
    name: {
        firstName: string;
        lastName: string;
        fullName: string;
    };
    avatar: string;
}

export class ConversationResDto {
    _id: string;
    participants: ParticipantResDto[];
    messages: {
        _id: string;
        message: {
            text?: string;
            images?: string;
            messType: 'text' | 'image';
        }[];
        createdAt: string;
    }[];
}
