declare interface ICreateNoti {
    type: string;
    fromId: string;
    toId: string;
    postId?: string;
    postPersonId?: string;
    conversationId?: string;
    conversationName?: string;
}
