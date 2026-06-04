export type SendReq = {
  message: string;
  chatId: string;
  branchId: string;
};

export type ChatReqPost = {
  systemprompt?: string;
  model: string;
};

export type ChatReqGet = {
  chatId: string;
};
