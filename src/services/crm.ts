import type {
  CrmMe,
  CrmTag,
  CrmNote,
  CrmAgent,
  CrmMember,
  CrmChannel,
  CrmMessage,
  CrmContact,
  CrmCandidate,
  CrmQuickReply,
  CrmLinkSearch,
  CrmDepartment,
  CrmConversation,
  CrmContactDetail,
  CrmContactPayload,
  CrmChannelPayload,
  CrmChannelSummary,
  CrmConversationList,
  CrmQuickReplyPayload,
  CrmDepartmentPayload,
  CrmConversationFilters,
  CrmMemberCreatePayload,
  CrmMemberUpdatePayload,
} from 'src/types/services/crm';

import { ApiService } from './api/api';

import type { QueryParams } from './api/api';

export class CrmService {
  private static readonly BASE_PATH = '/crm';

  static me(): Promise<CrmMe> {
    return ApiService.get<CrmMe>(`${this.BASE_PATH}/me`);
  }

  // Setores -------------------------------------------------------------

  static listDepartments(): Promise<CrmDepartment[]> {
    return ApiService.get<CrmDepartment[]>(`${this.BASE_PATH}/departments`);
  }

  static createDepartment(payload: CrmDepartmentPayload): Promise<CrmDepartment> {
    return ApiService.post<CrmDepartmentPayload, CrmDepartment>(
      `${this.BASE_PATH}/departments`,
      payload
    );
  }

  static updateDepartment(id: string, payload: CrmDepartmentPayload): Promise<CrmDepartment> {
    return ApiService.put<CrmDepartmentPayload, CrmDepartment>(
      `${this.BASE_PATH}/departments/${id}`,
      payload
    );
  }

  static deleteDepartment(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/departments/${id}`);
  }

  // Membros -------------------------------------------------------------

  static listMembers(): Promise<CrmMember[]> {
    return ApiService.get<CrmMember[]>(`${this.BASE_PATH}/members`);
  }

  static listCandidates(): Promise<CrmCandidate[]> {
    return ApiService.get<CrmCandidate[]>(`${this.BASE_PATH}/members/candidates`);
  }

  static createMember(payload: CrmMemberCreatePayload): Promise<CrmMember> {
    return ApiService.post<CrmMemberCreatePayload, CrmMember>(`${this.BASE_PATH}/members`, payload);
  }

  static updateMember(id: string, payload: CrmMemberUpdatePayload): Promise<CrmMember> {
    return ApiService.put<CrmMemberUpdatePayload, CrmMember>(
      `${this.BASE_PATH}/members/${id}`,
      payload
    );
  }

  static deleteMember(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/members/${id}`);
  }

  // Atendimento ------------------------------------------------------------

  static listConversations(filters: CrmConversationFilters): Promise<CrmConversationList> {
    return ApiService.get<CrmConversationList>(`${this.BASE_PATH}/conversations`, filters as QueryParams);
  }

  static getConversation(id: string): Promise<CrmConversation> {
    return ApiService.get<CrmConversation>(`${this.BASE_PATH}/conversations/${id}`);
  }

  static acceptConversation(id: string): Promise<CrmConversation> {
    return ApiService.post<object, CrmConversation>(`${this.BASE_PATH}/conversations/${id}/accept`, {});
  }

  static transferConversation(
    id: string,
    payload: { departmentId?: string | null; userId?: string | null; userType?: string | null; message?: string | null }
  ): Promise<CrmConversation> {
    return ApiService.post<typeof payload, CrmConversation>(`${this.BASE_PATH}/conversations/${id}/transfer`, payload);
  }

  static closeConversation(
    id: string,
    payload: { sendClosingMessage?: boolean; message?: string | null; rating?: number | null; ratingComment?: string | null }
  ): Promise<CrmConversation> {
    return ApiService.post<typeof payload, CrmConversation>(`${this.BASE_PATH}/conversations/${id}/close`, payload);
  }

  static reopenConversation(id: string): Promise<CrmConversation> {
    return ApiService.post<object, CrmConversation>(`${this.BASE_PATH}/conversations/${id}/reopen`, {});
  }

  static markConversationRead(id: string): Promise<void> {
    return ApiService.post<object, void>(`${this.BASE_PATH}/conversations/${id}/read`, {});
  }

  static startConversation(payload: {
    channelId: string;
    phone: string;
    name?: string;
    text?: string;
    template?: { name: string; language: string; components?: unknown[] };
  }): Promise<CrmConversation> {
    return ApiService.post<typeof payload, CrmConversation>(`${this.BASE_PATH}/conversations/start`, payload);
  }

  static listMessages(id: string, before?: string): Promise<{ data: CrmMessage[]; hasMore: boolean }> {
    return ApiService.get(`${this.BASE_PATH}/conversations/${id}/messages`, { before, limit: 40 });
  }

  static sendText(id: string, text: string, quotedMessageId?: string | null): Promise<CrmMessage> {
    return ApiService.post<object, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages`, {
      text,
      quotedMessageId: quotedMessageId || null,
    });
  }

  static sendMedia(id: string, file: File | Blob, opts: { text?: string; fileName?: string; quotedMessageId?: string | null } = {}): Promise<CrmMessage> {
    const form = new FormData();
    form.append('file', file, opts.fileName || (file as File).name || 'arquivo');
    if (opts.text) form.append('text', opts.text);
    if (opts.quotedMessageId) form.append('quotedMessageId', opts.quotedMessageId);
    return ApiService.post<FormData, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  static sendQuickReplyMedia(id: string, mediaKey: string, text?: string, fileName?: string | null): Promise<CrmMessage> {
    return ApiService.post<object, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages`, {
      mediaKey,
      text: text || '',
      fileName: fileName || null,
    });
  }

  static sendTemplate(id: string, templateId: string, variables: Record<string, string>): Promise<CrmMessage> {
    return ApiService.post<object, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/template`, { templateId, variables });
  }

  static editMessage(id: string, messageId: string, text: string): Promise<CrmMessage> {
    return ApiService.put<object, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages/${messageId}`, { text });
  }

  static deleteMessage(id: string, messageId: string): Promise<CrmMessage> {
    return ApiService.delete<CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages/${messageId}`);
  }

  static reactMessage(id: string, messageId: string, emoji: string): Promise<CrmMessage> {
    return ApiService.post<object, CrmMessage>(`${this.BASE_PATH}/conversations/${id}/messages/${messageId}/reaction`, { emoji });
  }

  static contactAvatar(contactId: string): Promise<{ avatarUrl: string | null }> {
    return ApiService.get(`${this.BASE_PATH}/contacts/${contactId}/avatar`);
  }

  static mediaUrl(key: string): Promise<{ url: string; expiresAt: string }> {
    return ApiService.get(`${this.BASE_PATH}/media/url`, { key, ttl: 900 });
  }

  static listNotes(id: string): Promise<CrmNote[]> {
    return ApiService.get<CrmNote[]>(`${this.BASE_PATH}/conversations/${id}/notes`);
  }

  static addNote(id: string, body: string): Promise<CrmNote> {
    return ApiService.post<object, CrmNote>(`${this.BASE_PATH}/conversations/${id}/notes`, { body });
  }

  static deleteNote(id: string, noteId: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/conversations/${id}/notes/${noteId}`);
  }

  static setConversationTags(id: string, tagIds: string[]): Promise<CrmConversation> {
    return ApiService.put<object, CrmConversation>(`${this.BASE_PATH}/conversations/${id}/tags`, { tagIds });
  }

  static listAgents(): Promise<CrmAgent[]> {
    return ApiService.get<CrmAgent[]>(`${this.BASE_PATH}/agents`);
  }

  // Contatos ----------------------------------------------------------------

  static getContact(id: string): Promise<CrmContactDetail> {
    return ApiService.get<CrmContactDetail>(`${this.BASE_PATH}/contacts/${id}`);
  }

  static updateContact(id: string, payload: CrmContactPayload): Promise<CrmContact> {
    return ApiService.put<CrmContactPayload, CrmContact>(`${this.BASE_PATH}/contacts/${id}`, payload);
  }

  static searchLinks(q: string): Promise<CrmLinkSearch> {
    return ApiService.get<CrmLinkSearch>(`${this.BASE_PATH}/contacts/link-search`, { q });
  }

  // Respostas rápidas ------------------------------------------------------

  static listQuickReplies(search?: string): Promise<CrmQuickReply[]> {
    return ApiService.get<CrmQuickReply[]>(`${this.BASE_PATH}/quick-replies`, { search });
  }

  static createQuickReply(payload: CrmQuickReplyPayload): Promise<CrmQuickReply> {
    return ApiService.post<CrmQuickReplyPayload, CrmQuickReply>(`${this.BASE_PATH}/quick-replies`, payload);
  }

  static updateQuickReply(id: string, payload: CrmQuickReplyPayload): Promise<CrmQuickReply> {
    return ApiService.put<CrmQuickReplyPayload, CrmQuickReply>(`${this.BASE_PATH}/quick-replies/${id}`, payload);
  }

  static deleteQuickReply(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/quick-replies/${id}`);
  }

  // Tags -------------------------------------------------------------------

  static listTags(): Promise<CrmTag[]> {
    return ApiService.get<CrmTag[]>(`${this.BASE_PATH}/tags`);
  }

  static createTag(payload: { name: string; color?: string }): Promise<CrmTag> {
    return ApiService.post<object, CrmTag>(`${this.BASE_PATH}/tags`, payload);
  }

  static updateTag(id: string, payload: { name?: string; color?: string }): Promise<CrmTag> {
    return ApiService.put<object, CrmTag>(`${this.BASE_PATH}/tags/${id}`, payload);
  }

  static deleteTag(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/tags/${id}`);
  }

  // Canais -----------------------------------------------------------------

  static listChannelSummary(): Promise<CrmChannelSummary[]> {
    return ApiService.get<CrmChannelSummary[]>(`${this.BASE_PATH}/channels/summary`);
  }

  static listChannels(): Promise<CrmChannel[]> {
    return ApiService.get<CrmChannel[]>(`${this.BASE_PATH}/channels`);
  }

  static getChannel(id: string): Promise<CrmChannel> {
    return ApiService.get<CrmChannel>(`${this.BASE_PATH}/channels/${id}`);
  }

  static createChannel(payload: CrmChannelPayload): Promise<CrmChannel> {
    return ApiService.post<CrmChannelPayload, CrmChannel>(`${this.BASE_PATH}/channels`, payload);
  }

  static updateChannel(id: string, payload: CrmChannelPayload): Promise<CrmChannel> {
    return ApiService.put<CrmChannelPayload, CrmChannel>(`${this.BASE_PATH}/channels/${id}`, payload);
  }

  static deleteChannel(
    id: string
  ): Promise<{ removed: 'hard' | 'soft'; closedConversations: number; providerWarning: string | null }> {
    return ApiService.delete(`${this.BASE_PATH}/channels/${id}`);
  }

  static connectChannel(id: string): Promise<{ status: string; detail: string | null }> {
    return ApiService.post<object, { status: string; detail: string | null }>(`${this.BASE_PATH}/channels/${id}/connect`, {});
  }

  static channelQr(id: string): Promise<{ status: string; qr: string | null; detail?: string | null }> {
    return ApiService.get(`${this.BASE_PATH}/channels/${id}/qr`);
  }

  static channelPairingCode(id: string, phone: string): Promise<{ code: string }> {
    return ApiService.post<object, { code: string }>(`${this.BASE_PATH}/channels/${id}/pairing-code`, { phone });
  }

  static channelStatus(id: string): Promise<{ status: string; detail: string | null }> {
    return ApiService.get(`${this.BASE_PATH}/channels/${id}/status`);
  }

  static disconnectChannel(id: string): Promise<{ status: string }> {
    return ApiService.post<object, { status: string }>(`${this.BASE_PATH}/channels/${id}/disconnect`, {});
  }

  static logoutChannel(id: string): Promise<{ status: string }> {
    return ApiService.post<object, { status: string }>(`${this.BASE_PATH}/channels/${id}/logout`, {});
  }
}
