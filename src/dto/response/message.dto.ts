export class MessageResDto {
    _id: string;
    sender: string;
    message: {
        text?: string;
        images?: string[];
        messType: 'text' | 'image';
    }[];
    updatedAt: string;
}

export class MessagePaginateResDto {
    limitTime: number;
    after: string;
    data: MessageResDto[];
}
