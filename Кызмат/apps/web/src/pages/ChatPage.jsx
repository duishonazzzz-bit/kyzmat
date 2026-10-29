import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedPersonName, localizeJob, translateCityName } from "../i18n/contentTranslations";

const pageCopy = {
  ru: {
    roles: { admin: "Администратор", customer: "Заказчик", worker: "Исполнитель" },
    statuses: { open: "Открыт", in_progress: "В работе", completed: "Завершен", cancelled: "Отменен" },
    emptyMessages: "Сообщений пока нет",
    you: "Вы",
    loadBootstrapError: "Не удалось загрузить сообщения",
    loadDialogError: "Не удалось загрузить диалог",
    noPreview: "Сообщений пока нет",
    pageTitle: "Сообщения",
    pageSubtitle:
      "Чат собран вокруг реальных диалогов, заказов и собеседников, чтобы заказчик и исполнитель могли продолжать разговор без ручного ввода ID.",
    dialogTitle: "Новый или текущий диалог",
    dialogText: "Выберите собеседника, а заказ добавьте только если разговор относится к конкретной задаче.",
    contact: "Собеседник",
    chooseContact: "Выберите собеседника",
    relatedJob: "Связанный заказ",
    noJob: "Без привязки к заказу",
    byJob: "По заказу",
    dialogs: "Диалоги",
    refresh: "Обновить",
    dialogsLoading: "Загрузка списка диалогов...",
    dialogsEmpty: "Диалогов пока нет. Выберите собеседника сверху и начните разговор.",
    newCount: "новых",
    openJob: "Открыть заказ",
    chooseDialog: "Выберите диалог",
    chooseDialogText: "Слева доступны активные переписки и быстрый старт нового разговора.",
    messagesLoading: "Загрузка сообщений...",
    noSelectedMessages: "Сообщений пока нет",
    noSelectedMessagesText: "Напишите первым, чтобы начать рабочий диалог.",
    openFile: "Открыть файл",
    messagePlaceholder: "Напишите сообщение",
    filePlaceholder: "Ссылка на файл или фото (необязательно)",
    sendErrorNoContact: "Сначала выберите собеседника",
    sendError: "Не удалось отправить сообщение",
    jobLinked: "Диалог привязан к заказу",
    commonDialog: "Сообщение отправится как общий диалог без привязки к заказу.",
    send: "Отправить",
    sending: "Отправка...",
    userFallback: "Пользователь",
    edit: "Редактировать",
    delete: "Удалить",
    saveEdit: "Сохранить",
    cancelEdit: "Отмена",
    edited: "изменено",
    deletedMessage: "Сообщение удалено",
    editError: "Не удалось изменить сообщение",
    deleteError: "Не удалось удалить сообщение",
  },
  ky: {
    roles: { admin: "Администратор", customer: "Кардар", worker: "Аткаруучу" },
    statuses: { open: "Ачык", in_progress: "Иште", completed: "Аяктаган", cancelled: "Жокко чыгарылган" },
    emptyMessages: "Азырынча билдирүү жок",
    you: "Сиз",
    loadBootstrapError: "Билдирүүлөрдү жүктөө мүмкүн болгон жок",
    loadDialogError: "Диалогду жүктөө мүмкүн болгон жок",
    noPreview: "Азырынча билдирүү жок",
    pageTitle: "Билдирүүлөр",
    pageSubtitle:
      "Чат чыныгы диалогдордун, заказдардын жана маектештердин айланасында курулган, ошондуктан кардар менен аткаруучу ID кол менен киргизбей эле сүйлөшүүнү уланта алышат.",
    dialogTitle: "Жаңы же учурдагы диалог",
    dialogText: "Маектешти тандаңыз, ал эми заказды сүйлөшүү белгилүү тапшырмага тиешелүү болгондо гана кошуңуз.",
    contact: "Маектеш",
    chooseContact: "Маектешти тандаңыз",
    relatedJob: "Байланышкан заказ",
    noJob: "Заказга байланбаган",
    byJob: "Заказ боюнча",
    dialogs: "Диалогдор",
    refresh: "Жаңыртуу",
    dialogsLoading: "Диалогдор тизмеси жүктөлүүдө...",
    dialogsEmpty: "Азырынча диалогдор жок. Жогору жактан маектешти тандап, сүйлөшүүнү баштаңыз.",
    newCount: "жаңы",
    openJob: "Заказды ачуу",
    chooseDialog: "Диалогду тандаңыз",
    chooseDialogText: "Сол жакта активдүү каттар жана жаңы сүйлөшүүнү тез баштоо бар.",
    messagesLoading: "Билдирүүлөр жүктөлүүдө...",
    noSelectedMessages: "Азырынча билдирүү жок",
    noSelectedMessagesText: "Иштөөчү диалогду баштоо үчүн биринчи өзүңүз жазыңыз.",
    openFile: "Файлды ачуу",
    messagePlaceholder: "Билдирүү жазыңыз",
    filePlaceholder: "Файлга же сүрөткө шилтеме (милдеттүү эмес)",
    sendErrorNoContact: "Адегенде маектешти тандаңыз",
    sendError: "Билдирүүнү жөнөтүү мүмкүн болгон жок",
    jobLinked: "Диалог ушул заказга байланган",
    commonDialog: "Билдирүү заказга байланбаган жалпы диалог катары жөнөтүлөт.",
    send: "Жөнөтүү",
    sending: "Жөнөтүлүүдө...",
    userFallback: "Колдонуучу",
    edit: "Өзгөртүү",
    delete: "Өчүрүү",
    saveEdit: "Сактоо",
    cancelEdit: "Жокко чыгаруу",
    edited: "өзгөртүлдү",
    deletedMessage: "Билдирүү өчүрүлдү",
    editError: "Билдирүүнү өзгөртүү мүмкүн болгон жок",
    deleteError: "Билдирүүнү өчүрүү мүмкүн болгон жок",
  },
  en: {
    roles: { admin: "Administrator", customer: "Customer", worker: "Specialist" },
    statuses: { open: "Open", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" },
    emptyMessages: "No messages yet",
    you: "You",
    loadBootstrapError: "Unable to load messages",
    loadDialogError: "Unable to load dialog",
    noPreview: "No messages yet",
    pageTitle: "Messages",
    pageSubtitle:
      "The chat is built around real dialogs, jobs, and contacts so customers and specialists can continue the conversation without entering IDs manually.",
    dialogTitle: "New or current dialog",
    dialogText: "Choose a contact, and add a job only if the conversation is related to a specific request.",
    contact: "Contact",
    chooseContact: "Choose a contact",
    relatedJob: "Related job",
    noJob: "No linked job",
    byJob: "By job",
    dialogs: "Dialogs",
    refresh: "Refresh",
    dialogsLoading: "Loading dialogs...",
    dialogsEmpty: "There are no dialogs yet. Choose a contact above and start the conversation.",
    newCount: "new",
    openJob: "Open job",
    chooseDialog: "Choose a dialog",
    chooseDialogText: "Active conversations and a quick start for a new dialog are available on the left.",
    messagesLoading: "Loading messages...",
    noSelectedMessages: "No messages yet",
    noSelectedMessagesText: "Send the first message to start the work conversation.",
    openFile: "Open file",
    messagePlaceholder: "Write a message",
    filePlaceholder: "File or photo link (optional)",
    sendErrorNoContact: "Choose a contact first",
    sendError: "Unable to send message",
    jobLinked: "Dialog is linked to the job",
    commonDialog: "The message will be sent as a general dialog without linking it to a job.",
    send: "Send",
    sending: "Sending...",
    userFallback: "User",
    edit: "Edit",
    delete: "Delete",
    saveEdit: "Save",
    cancelEdit: "Cancel",
    edited: "edited",
    deletedMessage: "Message deleted",
    editError: "Unable to edit message",
    deleteError: "Unable to delete message",
  },
};

function ChatPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get("withUserId") || "");
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get("jobId") || "");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [body, setBody] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loadingBootstrap, setLoadingBootstrap] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageActionLoading, setMessageActionLoading] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");

  const localizePreviewText = (value) => {
    if (value === "Сообщение удалено") return copy.deletedMessage;
    if (value === "Файл") return copy.openFile;
    if (value === "Сообщение") return copy.emptyMessages;
    return value;
  };

  const formatMessageDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString(language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const syncSearchParams = (nextWithUserId, nextJobId) => {
    const next = new URLSearchParams();
    if (nextWithUserId) next.set("withUserId", nextWithUserId);
    if (nextJobId) next.set("jobId", nextJobId);
    setSearchParams(next, { replace: true });
  };

  const loadJobs = async () => {
    if (!user?.id) return [];
    if (user.role === "customer") {
      const { data } = await api.get("/jobs", { params: { customerId: user.id, sort: "recent" } });
      return data;
    }
    if (user.role === "worker") {
      const { data } = await api.get("/jobs", { params: { workerId: user.id, sort: "recent" } });
      return data;
    }
    return [];
  };

  const loadBootstrap = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingBootstrap(true);
      setError("");
    }
    try {
      const [conversationsResult, contactsResult, jobsResult] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/messages/contacts"),
        loadJobs(),
      ]);
      setConversations(conversationsResult.data);
      setContacts(contactsResult.data);
      setJobs(jobsResult);
    } catch (requestError) {
      if (!silent) setError(requestError.response?.data?.message || copy.loadBootstrapError);
    } finally {
      if (!silent) setLoadingBootstrap(false);
    }
  };

  const loadMessages = async ({ silent = false } = {}) => {
    if (!selectedUserId && !selectedJobId) {
      setMessages([]);
      return;
    }
    if (!silent) {
      setLoadingMessages(true);
      setError("");
    }
    try {
      const params = {};
      if (selectedUserId) params.withUserId = selectedUserId;
      if (selectedJobId) params.jobId = selectedJobId;
      const { data } = await api.get("/messages", { params });
      setMessages(data);
    } catch (requestError) {
      if (!silent) setError(requestError.response?.data?.message || copy.loadDialogError);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, [user?.id, language]);

  useEffect(() => {
    const nextWithUserId = searchParams.get("withUserId") || "";
    const nextJobId = searchParams.get("jobId") || "";
    if (nextWithUserId !== selectedUserId) setSelectedUserId(nextWithUserId);
    if (nextJobId !== selectedJobId) setSelectedJobId(nextJobId);
  }, [searchParams]);

  useEffect(() => {
    syncSearchParams(selectedUserId, selectedJobId);
    loadMessages();
  }, [selectedUserId, selectedJobId]);

  useEffect(() => {
    if (!conversations.length && !contacts.length) return;
    if (!selectedUserId && !selectedJobId && conversations.length) {
      setSelectedUserId(conversations[0].contactId);
      setSelectedJobId(conversations[0].jobId || "");
    }
  }, [contacts, conversations, selectedJobId, selectedUserId]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const intervalId = window.setInterval(() => {
      loadBootstrap({ silent: true });
      if (selectedUserId || selectedJobId) loadMessages({ silent: true });
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, selectedJobId, selectedUserId]);

  const contactMap = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);
  const jobMap = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

  const availableContacts = useMemo(() => {
    if (!selectedJobId) return contacts;
    const filtered = contacts.filter((contact) => {
      const hasRelatedJob = (contact.relatedJobs || []).some((job) => job.id === selectedJobId);
      const hasConversationForJob = conversations.some(
        (conversation) => conversation.contactId === contact.id && conversation.jobId === selectedJobId,
      );
      return hasRelatedJob || hasConversationForJob;
    });
    return filtered.length ? filtered : contacts;
  }, [contacts, conversations, selectedJobId]);

  const selectedContact = selectedUserId ? contactMap.get(selectedUserId) || null : null;

  const availableJobsForContact = useMemo(() => {
    const byId = new Map();
    jobs.forEach((job) => byId.set(job.id, localizeJob({ id: job.id, title: job.title, status: job.status }, language)));
    (selectedContact?.relatedJobs || []).forEach((job) => byId.set(job.id, job));
    conversations
      .filter((conversation) => conversation.contactId === selectedUserId && conversation.jobId)
      .forEach((conversation) => {
        byId.set(conversation.jobId, localizeJob({ id: conversation.jobId, title: conversation.jobTitle, status: conversation.jobStatus }, language));
      });
    return Array.from(byId.values()).map((job) => localizeJob(job, language)).sort((left, right) =>
      left.title.localeCompare(right.title, language === "ky" ? "ky" : language === "en" ? "en" : "ru"),
    );
  }, [conversations, jobs, language, selectedContact, selectedUserId]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return availableJobsForContact.find((job) => job.id === selectedJobId) || jobMap.get(selectedJobId) || null;
  }, [availableJobsForContact, jobMap, selectedJobId]);

  const formatPreview = (conversation) => {
    if (!conversation?.lastMessagePreview) return copy.noPreview;
    const previewText = localizePreviewText(conversation.lastMessagePreview);
    return conversation.lastMessageIsMine ? `${copy.you}: ${previewText}` : previewText;
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    setSendError("");
    if (!selectedUserId) {
      setSendError(copy.sendErrorNoContact);
      return;
    }
    setSending(true);
    try {
      await api.post("/messages", {
        receiverId: selectedUserId,
        jobId: selectedJobId || undefined,
        body: body || undefined,
        fileUrl: fileUrl || undefined,
      });
      setBody("");
      setFileUrl("");
      await Promise.all([loadMessages(), loadBootstrap({ silent: true })]);
    } catch (requestError) {
      setSendError(requestError.response?.data?.message || copy.sendError);
    } finally {
      setSending(false);
    }
  };

  const startEditMessage = (message) => {
    setSendError("");
    setEditingMessageId(message.id);
    setEditBody(message.body || "");
    setEditFileUrl(message.fileUrl || "");
  };

  const cancelEditMessage = () => {
    setEditingMessageId("");
    setEditBody("");
    setEditFileUrl("");
  };

  const saveEditedMessage = async (messageId) => {
    setSendError("");
    setMessageActionLoading(messageId);
    try {
      await api.patch(`/messages/${messageId}`, {
        body: editBody || undefined,
        fileUrl: editFileUrl || undefined,
      });
      cancelEditMessage();
      await Promise.all([loadMessages(), loadBootstrap({ silent: true })]);
    } catch (requestError) {
      setSendError(requestError.response?.data?.message || copy.editError);
    } finally {
      setMessageActionLoading("");
    }
  };

  const deleteMessage = async (messageId) => {
    setSendError("");
    setMessageActionLoading(messageId);
    try {
      await api.delete(`/messages/${messageId}`);
      if (editingMessageId === messageId) cancelEditMessage();
      await Promise.all([loadMessages(), loadBootstrap({ silent: true })]);
    } catch (requestError) {
      setSendError(requestError.response?.data?.message || copy.deleteError);
    } finally {
      setMessageActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel">
        <h1 className="title">{copy.pageTitle}</h1>
        <p className="subtitle">{copy.pageSubtitle}</p>

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-lg font-bold text-slate-950">{copy.dialogTitle}</h2>
              <p className="mt-2 text-sm text-slate-600">{copy.dialogText}</p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">{copy.contact}</label>
                  <select className="input" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                    <option value="">{copy.chooseContact}</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {getLocalizedPersonName(contact, language, contact.fullName)}
                        {contact.city ? ` · ${translateCityName(contact.city, language)}` : ""}
                        {contact.role ? ` · ${copy.roles[contact.role] || contact.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">{copy.relatedJob}</label>
                  <select className="input" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
                    <option value="">{copy.noJob}</option>
                    {availableJobsForContact.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold text-slate-950">{copy.dialogs}</h2>
                <button className="btn-secondary w-full px-4 py-2 text-sm sm:w-auto" onClick={() => loadBootstrap()} type="button">
                  {copy.refresh}
                </button>
              </div>

              {loadingBootstrap && <p className="mt-4 text-sm text-slate-600">{copy.dialogsLoading}</p>}
              {!loadingBootstrap && conversations.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.dialogsEmpty}</p>}

              <div className="mt-4 space-y-3">
                {conversations.map((conversation) => {
                  const isActive =
                    conversation.contactId === selectedUserId && (conversation.jobId || "") === (selectedJobId || "");

                  return (
                    <button
                      key={conversation.key}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                      onClick={() => {
                        setSelectedUserId(conversation.contactId);
                        setSelectedJobId(conversation.jobId || "");
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>{getLocalizedPersonName({ fullName: conversation.contactName, fullNameKy: conversation.contactNameKy, fullNameEn: conversation.contactNameEn }, language, conversation.contactName)}</p>
                          <p className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                            {copy.roles[conversation.contactRole] || conversation.contactRole || copy.userFallback}
                            {conversation.contactCity ? ` · ${translateCityName(conversation.contactCity, language)}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>{formatMessageDate(conversation.lastMessageAt)}</p>
                          {conversation.unreadCount > 0 && (
                            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${isActive ? "bg-white/15 text-white" : "bg-[#f9ecef] text-[#8d1530]"}`}>
                              {conversation.unreadCount} {copy.newCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {conversation.jobTitle && <p className={`mt-3 text-xs ${isActive ? "text-[#f6d9df]" : "text-[#8d1530]"}`}>{copy.byJob}: {localizeJob({ title: conversation.jobTitle }, language).title}</p>}
                      <p className={`mt-2 text-sm ${isActive ? "text-slate-100" : "text-slate-600"}`}>{formatPreview(conversation)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{selectedContact ? getLocalizedPersonName(selectedContact, language, selectedContact.fullName) : copy.chooseDialog}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedContact
                    ? `${copy.roles[selectedContact.role] || selectedContact.role || copy.userFallback}${selectedContact.city ? ` · ${translateCityName(selectedContact.city, language)}` : ""}`
                    : copy.chooseDialogText}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                {selectedJob && (
                  <>
                    <span className="badge">{copy.statuses[selectedJob.status] || selectedJob.status}</span>
                    <Link className="btn-secondary" to={`/jobs/${selectedJob.id}`}>{copy.openJob}</Link>
                  </>
                )}
              </div>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

            {!selectedUserId && (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="text-base font-semibold text-slate-900">{copy.chooseDialog}</p>
                <p className="mt-2 text-sm text-slate-600">{copy.chooseDialogText}</p>
              </div>
            )}

            {selectedUserId && (
              <>
                <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {loadingMessages && <p className="text-sm text-slate-600">{copy.messagesLoading}</p>}
                  {!loadingMessages && messages.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                      <p className="text-base font-semibold text-slate-900">{copy.noSelectedMessages}</p>
                      <p className="mt-2 text-sm text-slate-600">{copy.noSelectedMessagesText}</p>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    const isEditing = editingMessageId === message.id;
                    const isMessageBusy = messageActionLoading === message.id;
                    return (
                      <article key={message.id} className={`max-w-[88%] rounded-[28px] border px-4 py-4 ${isMine ? "ml-auto border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900"} ${message.isDeleted ? "opacity-75" : ""}`}>
                        <div className="flex items-center justify-between gap-4">
                          <p className={`text-xs font-semibold uppercase ${isMine ? "text-slate-200" : "text-slate-500"}`}>{isMine ? copy.you : message.senderName}</p>
                          <p className={`text-xs ${isMine ? "text-slate-300" : "text-slate-500"}`}>
                            {formatMessageDate(message.createdAt)}
                            {message.editedAt && !message.isDeleted ? ` · ${copy.edited}` : ""}
                          </p>
                        </div>

                        {isEditing ? (
                          <div className="mt-3 grid gap-2">
                            <textarea
                              className="input min-h-24 bg-white text-slate-950"
                              onChange={(event) => setEditBody(event.target.value)}
                              placeholder={copy.messagePlaceholder}
                              value={editBody}
                            />
                            <input
                              className="input bg-white text-slate-950"
                              onChange={(event) => setEditFileUrl(event.target.value)}
                              placeholder={copy.filePlaceholder}
                              value={editFileUrl}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button className="btn-primary px-4 py-2 text-sm" disabled={isMessageBusy} onClick={() => saveEditedMessage(message.id)} type="button">
                                {copy.saveEdit}
                              </button>
                              <button className="btn-secondary px-4 py-2 text-sm" disabled={isMessageBusy} onClick={cancelEditMessage} type="button">
                                {copy.cancelEdit}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.isDeleted ? (
                              <p className={`mt-2 whitespace-pre-wrap text-sm italic leading-6 ${isMine ? "text-slate-300" : "text-slate-500"}`}>
                                {copy.deletedMessage}
                              </p>
                            ) : (
                              <>
                                {message.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>}
                                {message.fileUrl && (
                                  <a className={`mt-3 inline-flex text-sm font-semibold underline ${isMine ? "text-[#f4c7d1]" : "text-slate-900"}`} href={message.fileUrl} rel="noreferrer" target="_blank">
                                    {copy.openFile}
                                  </a>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {isMine && !message.isDeleted && !isEditing ? (
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <button
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${isMine ? "border-white/20 text-slate-200 hover:bg-white/10" : "border-slate-200 text-slate-600"}`}
                              disabled={isMessageBusy}
                              onClick={() => startEditMessage(message)}
                              type="button"
                            >
                              {copy.edit}
                            </button>
                            <button
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${isMine ? "border-white/20 text-[#f4c7d1] hover:bg-white/10" : "border-slate-200 text-slate-600"}`}
                              disabled={isMessageBusy}
                              onClick={() => deleteMessage(message.id)}
                              type="button"
                            >
                              {copy.delete}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                <form className="mt-5 grid gap-3 border-t border-slate-200 pt-5" onSubmit={sendMessage}>
                  <textarea className="input min-h-28" onChange={(event) => setBody(event.target.value)} placeholder={copy.messagePlaceholder} value={body} />
                  <input className="input" onChange={(event) => setFileUrl(event.target.value)} placeholder={copy.filePlaceholder} value={fileUrl} />

                  {sendError && <p className="text-sm font-medium text-red-600">{sendError}</p>}

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {selectedJob ? `${copy.jobLinked}: ${selectedJob.title}` : copy.commonDialog}
                    </p>
                    <button className="btn-primary w-full sm:w-auto" disabled={sending || !selectedUserId} type="submit">
                      {sending ? copy.sending : copy.send}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default ChatPage;
