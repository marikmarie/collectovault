<?php
declare(strict_types=1);

namespace Vault;

use PDO;
use PDOException;

final class VaultRepository
{
    public function __construct(private PDO $db) {}

    /** @param array<string,mixed> $row @return array<string,mixed> */
    private function chat(array $row): array { return ['id'=>(int)$row['id'], 'clientId'=>(int)$row['client_id'], 'senderType'=>$row['sender_type'], 'message'=>$row['message'], 'attachments'=>$row['attachments'] ? json_decode($row['attachments'], true) : null, 'isRead'=>(bool)$row['is_read'], 'readAt'=>$row['read_at'], 'createdAt'=>$row['created_at']]; }
    /** @param array<string,mixed> $row @return array<string,mixed> */
    private function feedback(array $row): array { return ['id'=>(int)$row['id'], 'clientId'=>(int)$row['client_id'], 'feedbackType'=>$row['feedback_type'], 'title'=>$row['title'], 'message'=>$row['message'], 'attachments'=>$row['attachments'] ? json_decode($row['attachments'], true) : null, 'status'=>$row['status'], 'priority'=>$row['priority'], 'createdAt'=>$row['created_at'], 'updatedAt'=>$row['updated_at']]; }
    /** @param array<string,mixed> $row @return array<string,mixed> */
    private function rating(array $row): array { return ['id'=>(int)$row['id'], 'clientId'=>(int)$row['client_id'], 'transactionId'=>(int)$row['transaction_id'], 'orderRating'=>(int)$row['order_rating'], 'paymentRating'=>(int)$row['payment_rating'], 'serviceRating'=>(int)$row['service_rating'], 'overallRating'=>(int)$row['overall_rating'], 'comment'=>$row['comment'], 'createdAt'=>$row['created_at'], 'updatedAt'=>$row['updated_at']]; }
    /** @param array<string,mixed> $row @return array<string,mixed> */
    private function contact(array $row): array { return ['id'=>(int)$row['id'], 'clientId'=>isset($row['client_id']) ? (int)$row['client_id'] : null, 'whatsappNumber'=>$row['whatsapp_number'] ?? null, 'contactType'=>$row['contact_type'] ?? null, 'value'=>$row['value'] ?? null, 'isPreferred'=>isset($row['is_preferred']) ? (bool)$row['is_preferred'] : null, 'isActive'=>isset($row['is_active']) ? (bool)$row['is_active'] : null, 'verifiedAt'=>$row['verified_at'] ?? null, 'createdAt'=>$row['created_at'], 'updatedAt'=>$row['updated_at']]; }

    /** @param list<mixed>|null $attachments @return array<string,mixed> */
    public function createChat(int $clientId, string $senderType, string $message, ?array $attachments): array { $q=$this->db->prepare('INSERT INTO vault_chat_messages (client_id,sender_type,message,attachments) VALUES (?,?,?,?)'); $q->execute([$clientId,$senderType,$message,$attachments ? json_encode($attachments, JSON_THROW_ON_ERROR) : null]); return $this->requireChat((int)$this->db->lastInsertId()); }
    /** @return array<string,mixed> */
    public function requireChat(int $id): array { $q=$this->db->prepare('SELECT * FROM vault_chat_messages WHERE id=?'); $q->execute([$id]); $row=$q->fetch(); if (!$row) throw new HttpException(404, 'Message not found'); return $this->chat($row); }
    /** @return list<array<string,mixed>> */
    public function chats(int $clientId, int $limit, int $offset): array { $q=$this->db->prepare('SELECT * FROM vault_chat_messages WHERE client_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?'); $q->bindValue(1,$clientId,PDO::PARAM_INT); $q->bindValue(2,$limit,PDO::PARAM_INT); $q->bindValue(3,$offset,PDO::PARAM_INT); $q->execute(); return array_reverse(array_map(fn($r)=>$this->chat($r), $q->fetchAll())); }
    public function readChat(int $id): void { $this->requireChat($id); $q=$this->db->prepare('UPDATE vault_chat_messages SET is_read=1,read_at=UTC_TIMESTAMP() WHERE id=?'); $q->execute([$id]); }
    public function readAllChats(int $clientId): void { $q=$this->db->prepare('UPDATE vault_chat_messages SET is_read=1,read_at=UTC_TIMESTAMP() WHERE client_id=? AND is_read=0'); $q->execute([$clientId]); }
    public function unreadChats(int $clientId): int { $q=$this->db->prepare('SELECT COUNT(*) FROM vault_chat_messages WHERE client_id=? AND is_read=0'); $q->execute([$clientId]); return (int)$q->fetchColumn(); }
    public function deleteChat(int $id): void { $this->requireChat($id); $q=$this->db->prepare('DELETE FROM vault_chat_messages WHERE id=?'); $q->execute([$id]); }

    /** @param list<mixed>|null $attachments @return array<string,mixed> */
    public function createFeedback(int $clientId, string $type, string $title, string $message, ?array $attachments): array { $q=$this->db->prepare('INSERT INTO vault_feedback (client_id,feedback_type,title,message,attachments) VALUES (?,?,?,?,?)'); $q->execute([$clientId,$type,$title,$message,$attachments ? json_encode($attachments, JSON_THROW_ON_ERROR) : null]); return $this->requireFeedback((int)$this->db->lastInsertId()); }
    /** @return array<string,mixed> */
    public function requireFeedback(int $id): array { $q=$this->db->prepare('SELECT * FROM vault_feedback WHERE id=?'); $q->execute([$id]); $row=$q->fetch(); if (!$row) throw new HttpException(404, 'Feedback not found'); return $this->feedback($row); }
    /** @return list<array<string,mixed>> */
    public function feedbackForCustomer(int $clientId,int $limit,int $offset): array { $q=$this->db->prepare('SELECT * FROM vault_feedback WHERE client_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?'); $q->bindValue(1,$clientId,PDO::PARAM_INT); $q->bindValue(2,$limit,PDO::PARAM_INT); $q->bindValue(3,$offset,PDO::PARAM_INT); $q->execute(); return array_map(fn($r)=>$this->feedback($r),$q->fetchAll()); }
    /** @return list<array<string,mixed>> */
    public function feedbackForStatus(string $status,int $limit,int $offset): array { $q=$this->db->prepare('SELECT * FROM vault_feedback WHERE status=? ORDER BY FIELD(priority,"critical","high","medium","low"),created_at DESC LIMIT ? OFFSET ?'); $q->bindValue(1,$status); $q->bindValue(2,$limit,PDO::PARAM_INT); $q->bindValue(3,$offset,PDO::PARAM_INT); $q->execute(); return array_map(fn($r)=>$this->feedback($r),$q->fetchAll()); }
    /** @param array<string,mixed> $changes */
    public function updateFeedback(int $id,array $changes): void { $this->requireFeedback($id); $allowed=['title'=>'title','message'=>'message','status'=>'status','priority'=>'priority','attachments'=>'attachments']; $sets=[];$values=[]; foreach($allowed as $key=>$column) if(array_key_exists($key,$changes)){ $sets[]="{$column}=?"; $values[]=$key==='attachments' ? ($changes[$key]===null?null:json_encode($changes[$key],JSON_THROW_ON_ERROR)) : $changes[$key]; } if(!$sets)return; $values[]=$id; $q=$this->db->prepare('UPDATE vault_feedback SET '.implode(',',$sets).',updated_at=UTC_TIMESTAMP() WHERE id=?');$q->execute($values); }
    public function deleteFeedback(int $id): void { $this->requireFeedback($id);$q=$this->db->prepare('DELETE FROM vault_feedback WHERE id=?');$q->execute([$id]); }
    public function openFeedbackCount(): int { return (int)$this->db->query("SELECT COUNT(*) FROM vault_feedback WHERE status='open'")->fetchColumn(); }

    /** @param array<string,mixed> $values @return array<string,mixed> */
    public function createRating(array $values): array { try { $q=$this->db->prepare('INSERT INTO vault_ratings (client_id,transaction_id,order_rating,payment_rating,service_rating,overall_rating,comment) VALUES (?,?,?,?,?,?,?)'); $q->execute([$values['clientId'],$values['transactionId'],$values['orderRating'],$values['paymentRating'],$values['serviceRating'],$values['overallRating'],$values['comment'] ?? null]); } catch(PDOException $e) { if($e->getCode()==='23000') throw new HttpException(400,'This transaction has already been rated'); throw $e; } return $this->requireRating((int)$this->db->lastInsertId()); }
    /** @return array<string,mixed> */
    public function requireRating(int $id): array { $q=$this->db->prepare('SELECT * FROM vault_ratings WHERE id=?');$q->execute([$id]);$row=$q->fetch();if(!$row)throw new HttpException(404,'Rating not found');return $this->rating($row); }
    /** @return array<string,mixed>|null */
    public function ratingForTransaction(int $transactionId): ?array { $q=$this->db->prepare('SELECT * FROM vault_ratings WHERE transaction_id=?');$q->execute([$transactionId]);$row=$q->fetch();return $row?$this->rating($row):null; }
    /** @return list<array<string,mixed>> */
    public function ratingsForCustomer(int $clientId,int $limit,int $offset): array { $q=$this->db->prepare('SELECT * FROM vault_ratings WHERE client_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?');$q->bindValue(1,$clientId,PDO::PARAM_INT);$q->bindValue(2,$limit,PDO::PARAM_INT);$q->bindValue(3,$offset,PDO::PARAM_INT);$q->execute();return array_map(fn($r)=>$this->rating($r),$q->fetchAll()); }
    /** @return array<string,mixed> */
    public function ratingAverage(int $clientId): array { $q=$this->db->prepare('SELECT AVG(order_rating) avgOrderRating,AVG(payment_rating) avgPaymentRating,AVG(service_rating) avgServiceRating,AVG(overall_rating) avgOverallRating,COUNT(*) totalRatings FROM vault_ratings WHERE client_id=?');$q->execute([$clientId]);$row=$q->fetch() ?: []; return ['avgOrderRating'=>$row['avgOrderRating']!==null?(float)$row['avgOrderRating']:null,'avgPaymentRating'=>$row['avgPaymentRating']!==null?(float)$row['avgPaymentRating']:null,'avgServiceRating'=>$row['avgServiceRating']!==null?(float)$row['avgServiceRating']:null,'avgOverallRating'=>$row['avgOverallRating']!==null?(float)$row['avgOverallRating']:null,'totalRatings'=>(int)($row['totalRatings']??0)]; }
    /** @param array<string,mixed> $changes */
    public function updateRating(int $id,array $changes):void{$this->requireRating($id);$map=['orderRating'=>'order_rating','paymentRating'=>'payment_rating','serviceRating'=>'service_rating','overallRating'=>'overall_rating','comment'=>'comment'];$sets=[];$values=[];foreach($map as $key=>$column)if(array_key_exists($key,$changes)){$sets[]="{$column}=?";$values[]=$changes[$key];}if(!$sets)return;$values[]=$id;$q=$this->db->prepare('UPDATE vault_ratings SET '.implode(',',$sets).',updated_at=UTC_TIMESTAMP() WHERE id=?');$q->execute($values);}
    public function deleteRating(int $id):void{$this->requireRating($id);$q=$this->db->prepare('DELETE FROM vault_ratings WHERE id=?');$q->execute([$id]);}

    /** @return array<string,mixed> */
    public function setUserWhatsApp(int $clientId,string $number):array{$q=$this->db->prepare('INSERT INTO vault_whatsapp_contacts (client_id,whatsapp_number,is_preferred) VALUES (?,?,1) ON DUPLICATE KEY UPDATE whatsapp_number=VALUES(whatsapp_number),is_preferred=1,updated_at=UTC_TIMESTAMP()');$q->execute([$clientId,$number]);return $this->requireUserWhatsApp($clientId);}
    /** @return array<string,mixed> */
    public function requireUserWhatsApp(int $clientId):array{$q=$this->db->prepare('SELECT * FROM vault_whatsapp_contacts WHERE client_id=?');$q->execute([$clientId]);$row=$q->fetch();if(!$row)throw new HttpException(404,'No WhatsApp contact found');return $this->contact($row);}
    public function deleteUserWhatsApp(int $clientId):void{$this->requireUserWhatsApp($clientId);$q=$this->db->prepare('DELETE FROM vault_whatsapp_contacts WHERE client_id=?');$q->execute([$clientId]);}
    /** @return array<string,mixed> */
    public function setBusinessContact(string $type,string $value):array{$q=$this->db->prepare('INSERT INTO vault_business_contacts (contact_type,value,is_active) VALUES (?,?,1) ON DUPLICATE KEY UPDATE value=VALUES(value),is_active=1,updated_at=UTC_TIMESTAMP()');$q->execute([$type,$value]);return $this->requireBusinessContact($type);}
    /** @return array<string,mixed> */
    public function requireBusinessContact(string $type):array{$q=$this->db->prepare('SELECT * FROM vault_business_contacts WHERE contact_type=? AND is_active=1');$q->execute([$type]);$row=$q->fetch();if(!$row)throw new HttpException(404,"No business {$type} contact configured");return $this->contact($row);}
    /** @return array<string,array<string,mixed>> */
    public function allBusinessContacts():array{$rows=$this->db->query('SELECT * FROM vault_business_contacts WHERE is_active=1')->fetchAll();$out=[];foreach($rows as $row){$out[$row['contact_type']]=$this->contact($row);}return $out;}

    /** @param array<string,mixed> $payload */
    public function cachePayment(string $transactionId,string $status,array $payload):void{$q=$this->db->prepare('INSERT INTO vault_payment_status_cache (transaction_id,status,payload_json) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),payload_json=VALUES(payload_json),updated_at=UTC_TIMESTAMP()');$q->execute([$transactionId,$status,json_encode($payload,JSON_THROW_ON_ERROR)]);}
    /** @return array<string,mixed>|null */
    public function cachedPayment(string $transactionId):?array{$q=$this->db->prepare('SELECT * FROM vault_payment_status_cache WHERE transaction_id=?');$q->execute([$transactionId]);$row=$q->fetch();return $row?['status'=>$row['status'],'payment'=>json_decode($row['payload_json'],true)]:null;}

    /** @param array<string,mixed> $collection */
    public function saveCardCollection(array $collection,string $clientId,string $collectoId,string $amount):void{$q=$this->db->prepare('INSERT INTO vault_card_collections (collection_id,client_id,collecto_id,expected_amount,currency,description,status,checkout_url) VALUES (?,?,?,?,?,?,?,?)');$q->execute([$collection['id'],$clientId,$collectoId,$amount,$collection['currency']??'UGX',$collection['description']??'',$collection['status']??'PENDING',$collection['checkout_url']]);}
    /** @return array<string,mixed> */
    public function requireCardCollection(string $id):array{$q=$this->db->prepare('SELECT * FROM vault_card_collections WHERE collection_id=?');$q->execute([$id]);$row=$q->fetch();if(!$row)throw new HttpException(404,'Card collection was not found');return $row;}
    public function updateCardStatus(string $id,string $status):void{$q=$this->db->prepare('UPDATE vault_card_collections SET status=?,updated_at=UTC_TIMESTAMP() WHERE collection_id=?');$q->execute([$status,$id]);}
    /** @return array{state:string,response:array<string,mixed>|null} */
    public function beginFinalization(string $id):array{try{$q=$this->db->prepare("INSERT INTO vault_card_finalizations (collection_id,state) VALUES (?,'processing')");$q->execute([$id]);return ['state'=>'started','response'=>null];}catch(PDOException $e){if($e->getCode()!=='23000')throw $e;$q=$this->db->prepare('SELECT * FROM vault_card_finalizations WHERE collection_id=?');$q->execute([$id]);$row=$q->fetch();if(($row['state']??'')==='completed'&&$row['response_json'])return ['state'=>'completed','response'=>json_decode($row['response_json'],true)];if(($row['state']??'')==='failed'){$q=$this->db->prepare("UPDATE vault_card_finalizations SET state='processing',updated_at=UTC_TIMESTAMP() WHERE collection_id=?");$q->execute([$id]);return ['state'=>'started','response'=>null];}$q=$this->db->prepare("UPDATE vault_card_finalizations SET state='processing',updated_at=UTC_TIMESTAMP() WHERE collection_id=? AND updated_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE)");$q->execute([$id]);return $q->rowCount()>0?['state'=>'started','response'=>null]:['state'=>'processing','response'=>null];}}
    /** @param array<string,mixed> $response */
    public function completeFinalization(string $id,array $response):void{$q=$this->db->prepare("UPDATE vault_card_finalizations SET state='completed',response_json=?,updated_at=UTC_TIMESTAMP() WHERE collection_id=?");$q->execute([json_encode($response,JSON_THROW_ON_ERROR),$id]);}
    public function failFinalization(string $id):void{$q=$this->db->prepare("UPDATE vault_card_finalizations SET state='failed',updated_at=UTC_TIMESTAMP() WHERE collection_id=?");$q->execute([$id]);}
}
