<?php
declare(strict_types=1);

namespace Vault;

final class CollectoController
{
    public function __construct(private CollectoService $collecto, private VaultRepository $store) {}
    /** @param array<string,mixed> $body */
    public function auth(array $body): never { if ($body === []) throw new HttpException(400,'Request body is required'); $this->forward('/auth',$body); }
    /** @param array<string,mixed> $body */
    public function authVerify(array $body): never { $this->forward('/authVerify',$body); }
    /** @param array<string,mixed> $body */
    public function getByUsername(array $body): never { if(trim((string)($body['username']??''))==='')throw new HttpException(400,'username is required');$this->forward('/getByUsername',['username'=>trim((string)$body['username'])]); }
    /** @param array<string,mixed> $body */
    public function setUsername(array $body,?string $auth): never { $clientId=trim((string)($body['clientId']??''));$username=trim((string)($body['username']??''));$action=$body['action']??null;if($clientId===''||$username==='')throw new HttpException(400,'Both clientId and username are required');if($action!==null&&!in_array($action,['create','update'],true))throw new HttpException(400,'Action must be either create or update');if(strlen($username)<3||strlen($username)>100||preg_match('/^[a-zA-Z0-9_-]+$/',$username)!==1)throw new HttpException(400,'Username must be 3–100 letters, numbers, underscores, or hyphens');$response=$this->collecto->post('/clientUsername',$body,$auth);if($response['status']<200||$response['status']>=300){$status=$response['status']===409?409:($response['status']?:400);Response::json(['success'=>false,'message'=>HttpClient::message($response['data'],'Could not set username at this time')],$status);} $data=is_array($response['data']['data']??null)?$response['data']['data']:[];Response::json(['success'=>true,'message'=>$data['message']??'Username set successfully','data'=>['clientId'=>$clientId,'username'=>$data['clientUsername']??$username,'status'=>$response['data']['status_message']??null]]); }
    /** @param array<string,mixed> $body */
    public function requestToPay(array $body,?string $auth): never { if(trim((string)($body['paymentOption']??''))==='')throw new HttpException(400,'Missing payment method');if(trim((string)($body['collectoId']??''))===''||trim((string)($body['clientId']??''))==='')throw new HttpException(400,'Missing collectoId or clientId');if(!empty($body['phone']))$body['phone']=preg_replace('/^0/','256',(string)$body['phone']);$response=$this->collecto->post('/requestToPay',$body,$auth);if($response['status']<200||$response['status']>=300)Response::json(['message'=>'Request to pay failed','error'=>HttpClient::message($response['data'],'Request to pay failed')],$response['status']?:503);$inner=is_array($response['data']['data']??null)?$response['data']['data']:[];$transactionId=$inner['transactionId']??$inner['transaction_id']??$inner['id']??null;if($transactionId!==null)$this->store->cachePayment((string)$transactionId,'pending',$inner);Response::json(['status'=>$response['data']['status']??'200','status_message'=>$response['data']['status_message']??'success','data'=>['requestToPay'=>true,'message'=>$inner['message']??'Confirm payment via the prompt on your phone.','transactionId'=>$transactionId]]); }
    /** @param array<string,mixed> $body */
    public function requestToPayStatus(array $body,?string $auth): never { $id=trim((string)($body['transactionId']??''));if($id==='')throw new HttpException(400,'Missing transactionId in body');try{$response=$this->collecto->post('/requestToPayStatus',$body,$auth);if($response['status']<200||$response['status']>=300)throw new HttpException($response['status'],'Collecto request failed');$payment=is_array($response['data']['data']??null)?$response['data']['data']:[];$value=strtolower((string)($payment['status']??$payment['paymentStatus']??$payment['invoiceStatus']??($payment['invoice']['status']??'')));$status=(str_contains($value,'success')||str_contains($value,'paid')||str_contains($value,'confirmed'))?'confirmed':'pending';$this->store->cachePayment($id,$status,$payment);Response::json(['transactionId'=>$id,'status'=>$status,'payment'=>$payment]);}catch(\Throwable){$cached=$this->store->cachedPayment($id);if($cached)Response::json(['transactionId'=>$id,'status'=>$cached['status'],'payment'=>$cached['payment'],'message'=>'Local record used - Collecto unreachable']);Response::json(['transactionId'=>$id,'status'=>'unknown','message'=>'Collecto unreachable and no local record'],503);} }
    /** @param array<string,mixed> $body */
    public function verifyPhoneNumber(array $body,?string $auth): never { $phone=trim((string)($body['phoneNumber']??''));if($phone==='')throw new HttpException(400,'Missing phoneNumber');$payload=['vaultOTPToken'=>$body['vaultOTPToken']??null,'collectoId'=>$body['collectoId']??null,'clientId'=>$body['clientId']??null,'phone'=>$phone];$response=$this->collecto->post('/verifyPhoneNumber',$payload,$auth);if($response['status']>=200&&$response['status']<300)Response::json($response['data']);Response::json(['success'=>true,'phoneNumber'=>$phone,'verified'=>true,'trxnId'=>'VER-'.(string)round(microtime(true)*1000),'message'=>'Local verification (Collecto unreachable)']); }
    /** @param array<string,mixed> $body */
    public function services(array $body,?string $auth): never { $otp=$body['vaultOTPToken']??null;$collectoId=$body['collectoId']??null;if(!$collectoId&&!$otp)throw new HttpException(400,'collectoId is required in the request body');$this->forward('/servicesAndProducts',['vaultOTPToken'=>$otp,'collectoId'=>$collectoId,'page'=>max(1,(int)($body['page']??1))],$auth); }
    /** @param array<string,mixed> $body */
    public function invoiceDetails(array $body,?string $auth): never { $this->forward('/invoiceDetails',$body,$auth); }
    /** @param array<string,mixed> $body */
    public function invoice(array $body,?string $auth): never { $items=$body['items']??null;if(!is_array($items)||$items===[])throw new HttpException(400,'Invalid or missing items');$first=is_array($items[0]??null)?$items[0]:[];$collectoId=$first['collectoId']??$body['collectoId']??null;$clientId=$first['clientId']??$body['clientId']??null;if(!$collectoId||!$clientId)throw new HttpException(400,'collectoId and clientId are required');$forward=[];foreach($items as $item){if(!is_array($item))continue;$quantity=(float)($item['quantity']??$item['Quantity']??$item['qty']??0);$total=(float)($item['totalAmount']??$item['total']??$item['amount']??0);$unit=isset($item['amount'])&&!isset($item['totalAmount'])?(float)$item['amount']:($quantity>0?$total/$quantity:$total);$forward[]=['serviceId'=>$item['serviceId']??null,'serviceName'=>$item['serviceName']??null,'amount'=>$unit,'quantity'=>$quantity];}$computed=array_reduce($forward,fn($sum,$item)=>$sum+$item['amount']*$item['quantity'],0.0);$payload=['items'=>$forward,'amount'=>isset($body['totalAmount'])?(float)$body['totalAmount']:$computed,'collectoId'=>(string)$collectoId,'clientId'=>(string)$clientId];if(!empty($body['vaultOTPToken']))$payload['vaultOTPToken']=$body['vaultOTPToken'];if(!empty($body['staffId']))$payload['staffId']=$body['staffId'];$this->forward('/createInvoice',$payload,$auth); }
    /** @param array<string,mixed> $body */
    public function loyaltySettings(array $body,?string $auth): never { if(empty($body['collectoId'])||empty($body['clientId']))throw new HttpException(400,'collectoId and clientId are required');$response=$this->collecto->post('/loyaltySettings',['collectoId'=>$body['collectoId'],'clientId'=>$body['clientId']],$auth);if($response['status']>=200&&$response['status']<300)Response::json($response['data']);Response::json(['success'=>true,'collectoId'=>$body['collectoId'],'clientId'=>$body['clientId'],'pointsToCurrencyRate'=>100,'message'=>'Local loyalty settings (Collecto unreachable)']); }
    /** @param array<string,mixed> $payload */
    private function forward(string $path,array $payload,?string $auth=null): never { $response=$this->collecto->post($path,$payload,$auth);Response::json($response['data'],$response['status']); }
}

final class CardPaymentsController
{
    public function __construct(private CardPaymentsService $cards) {}
    /** @param array<string,mixed> $body */
    public function create(array $body,?string $auth): never{$this->cards->requireSession($auth);Response::json(['data'=>$this->cards->create($body)],201);}
    /** @param array<string,mixed> $query */
    public function status(string $id,array $query,?string $auth): never{$this->cards->requireSession($auth);Response::json(['data'=>$this->cards->status($this->cards->validId($id),$query)]);}
    /** @param array<string,mixed> $body */
    public function complete(string $id,array $body,?string $auth): never{$this->cards->requireSession($auth);$collecto=new CollectoService();Response::json($this->cards->complete($this->cards->validId($id),$body,$auth,$collecto));}
}

final class LocalController
{
    public function __construct(private VaultRepository $store) {}
    /** @param array<string,mixed> $body */
    public function createRating(array $body): never { $clientId=$this->id($body['clientId']??null,'clientId');$transactionId=$this->id($body['transactionId']??null,'transactionId');$data=['clientId'=>$clientId,'transactionId'=>$transactionId,'orderRating'=>$this->stars($body['orderRating']??null),'paymentRating'=>$this->stars($body['paymentRating']??null),'serviceRating'=>$this->stars($body['serviceRating']??null),'overallRating'=>$this->stars($body['overallRating']??null),'comment'=>$this->nullableText($body['comment']??null,5000)];Response::json($this->store->createRating($data),201); }
    public function rating(int $id): never { Response::json($this->store->requireRating($id)); }
    public function ratingForTransaction(int $transactionId): never { $rating=$this->store->ratingForTransaction($transactionId);if(!$rating)throw new HttpException(404,'No rating found for this transaction');Response::json($rating); }
    /** @param array<string,mixed> $query */
    public function ratingsForCustomer(int $clientId,array $query): never { Response::json($this->store->ratingsForCustomer($clientId,$this->limit($query,10),$this->offset($query))); }
    public function ratingAverage(int $clientId): never { Response::json($this->store->ratingAverage($clientId)); }
    /** @param array<string,mixed> $body */
    public function updateRating(int $id,array $body): never { $changes=[];foreach(['orderRating','paymentRating','serviceRating','overallRating'] as $field)if(array_key_exists($field,$body))$changes[$field]=$this->stars($body[$field]);if(array_key_exists('comment',$body))$changes['comment']=$this->nullableText($body['comment'],5000);$this->store->updateRating($id,$changes);Response::json(['message'=>'Rating updated successfully']); }
    public function deleteRating(int $id): never { $this->store->deleteRating($id);Response::json(['message'=>'Rating deleted successfully']); }

    /** @param array<string,mixed> $body */
    public function createFeedback(array $body): never { $clientId=$this->id($body['clientId']??null,'clientId');$type=(string)($body['feedbackType']??'');if(!in_array($type,['order','service','app','general'],true))throw new HttpException(400,'feedbackType must be order, service, app, or general');$title=$this->text($body['title']??null,'Feedback title',255);$message=$this->text($body['message']??null,'Feedback message',5000);Response::json($this->store->createFeedback($clientId,$type,$title,$message,$this->attachments($body['attachments']??null)),201); }
    public function feedback(int $id): never { Response::json($this->store->requireFeedback($id)); }
    /** @param array<string,mixed> $query */
    public function feedbackForCustomer(int $id,array $query): never { Response::json($this->store->feedbackForCustomer($id,$this->limit($query,20),$this->offset($query))); }
    /** @param array<string,mixed> $query */
    public function feedbackForStatus(string $status,array $query): never { if(!in_array($status,['open','in-progress','resolved','closed'],true))throw new HttpException(400,'Invalid feedback status');Response::json($this->store->feedbackForStatus($status,$this->limit($query,20),$this->offset($query))); }
    public function openFeedbackCount(): never { Response::json(['openCount'=>$this->store->openFeedbackCount()]); }
    /** @param array<string,mixed> $body */
    public function updateFeedback(int $id,array $body): never { $changes=[];if(array_key_exists('title',$body))$changes['title']=$this->text($body['title'],'Feedback title',255);if(array_key_exists('message',$body))$changes['message']=$this->text($body['message'],'Feedback message',5000);if(array_key_exists('status',$body)){if(!in_array($body['status'],['open','in-progress','resolved','closed'],true))throw new HttpException(400,'Invalid feedback status');$changes['status']=$body['status'];}if(array_key_exists('priority',$body)){if(!in_array($body['priority'],['low','medium','high','critical'],true))throw new HttpException(400,'Invalid feedback priority');$changes['priority']=$body['priority'];}if(array_key_exists('attachments',$body))$changes['attachments']=$this->attachments($body['attachments']);$this->store->updateFeedback($id,$changes);Response::json(['message'=>'Feedback updated successfully']); }
    public function resolveFeedback(int $id): never { $this->store->updateFeedback($id,['status'=>'resolved']);Response::json(['message'=>'Feedback resolved']); }
    public function closeFeedback(int $id): never { $this->store->updateFeedback($id,['status'=>'closed']);Response::json(['message'=>'Feedback closed']); }
    public function deleteFeedback(int $id): never { $this->store->deleteFeedback($id);Response::json(['message'=>'Feedback deleted successfully']); }

    /** @param array<string,mixed> $body */
    public function createChatMessage(array $body): never { $clientId=$this->id($body['clientId']??null,'clientId');$sender=$body['senderType']??'customer';if(!in_array($sender,['customer','support'],true))throw new HttpException(400,'senderType must be customer or support');Response::json($this->store->createChat($clientId,$sender,$this->text($body['message']??null,'Message',5000),$this->attachments($body['attachments']??null)),201); }
    public function chatMessage(int $id): never { Response::json($this->store->requireChat($id)); }
    /** @param array<string,mixed> $query */
    public function chatForCustomer(int $id,array $query): never { Response::json($this->store->chats($id,$this->limit($query,50),$this->offset($query))); }
    public function unreadMessages(int $id): never { Response::json(['unreadCount'=>$this->store->unreadChats($id)]); }
    public function markChatRead(int $id): never { $this->store->readChat($id);Response::json(['message'=>'Message marked as read']); }
    public function markAllChatRead(int $id): never { $this->store->readAllChats($id);Response::json(['message'=>'All messages marked as read']); }
    /** @param array<string,mixed> $body */
    public function supportReply(int $id,array $body): never { Response::json($this->store->createChat($id,'support',$this->text($body['message']??null,'Message',5000),$this->attachments($body['attachments']??null)),201); }
    public function deleteChatMessage(int $id): never { $this->store->deleteChat($id);Response::json(['message'=>'Message deleted successfully']); }

    /** @param array<string,mixed> $body */
    public function setUserWhatsApp(array $body): never { $clientId=$this->id($body['clientId']??null,'clientId');$number=$this->phone($body['whatsappNumber']??null,'whatsappNumber');Response::json($this->store->setUserWhatsApp($clientId,$number),201); }
    public function userWhatsApp(int $id): never { Response::json($this->store->requireUserWhatsApp($id)); }
    public function userWhatsAppUrl(int $id): never { $contact=$this->store->requireUserWhatsApp($id);Response::json(['whatsappUrl'=>'https://wa.me/'.preg_replace('/\D/','',(string)$contact['whatsappNumber'])]); }
    public function deleteUserWhatsApp(int $id): never { $this->store->deleteUserWhatsApp($id);Response::json(['message'=>'WhatsApp contact deleted successfully']); }
    /** @param array<string,mixed> $body */
    public function setBusinessContact(string $type,array $body): never { $key=$type==='whatsapp'?'whatsappNumber':$type;$value=$type==='email'?$this->email($body[$key]??null):$this->phone($body[$key]??null,$key);Response::json($this->store->setBusinessContact($type,$value),201); }
    public function businessContact(string $type): never { Response::json($this->store->requireBusinessContact($type)); }
    public function businessWhatsAppUrl(): never { $contact=$this->store->requireBusinessContact('whatsapp');Response::json(['whatsappUrl'=>'https://wa.me/'.preg_replace('/\D/','',(string)$contact['value'])]); }
    public function allBusinessContacts(): never { Response::json($this->store->allBusinessContacts()); }

    private function id(mixed $value,string $field):int{$id=filter_var($value,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);if($id===false)throw new HttpException(400,"{$field} is required");return $id;}
    private function stars(mixed $value):int{$rating=filter_var($value,FILTER_VALIDATE_INT);if($rating===false||$rating<1||$rating>5)throw new HttpException(400,'All ratings must be between 1 and 5 stars');return $rating;}
    private function text(mixed $value,string $field,int $max):string{$value=trim((string)$value);if($value==='')throw new HttpException(400,"{$field} is required");if(mb_strlen($value)>$max)throw new HttpException(400,"{$field} is too long");return $value;}
    private function nullableText(mixed $value,int $max):?string{if($value===null)return null;$value=trim((string)$value);if($value==='' )return null;if(mb_strlen($value)>$max)throw new HttpException(400,'Text is too long');return $value;}
    /** @return list<mixed>|null */
    private function attachments(mixed $value):?array{if($value===null)return null;if(!is_array($value)||array_is_list($value)===false)throw new HttpException(400,'attachments must be an array');return array_values($value);}
    /** @param array<string,mixed> $query */
    private function limit(array $query,int $default):int{return max(1,min(100,(int)($query['limit']??$default)));}
    /** @param array<string,mixed> $query */
    private function offset(array $query):int{return max(0,(int)($query['offset']??0));}
    private function phone(mixed $value,string $field):string{$value=trim((string)$value);if(preg_match('/^\+?[1-9]\d{1,14}$/',$value)!==1)throw new HttpException(400,"Invalid {$field} format");return $value;}
    private function email(mixed $value):string{$value=trim((string)$value);if(!filter_var($value,FILTER_VALIDATE_EMAIL))throw new HttpException(400,'Invalid email format');return $value;}
}
