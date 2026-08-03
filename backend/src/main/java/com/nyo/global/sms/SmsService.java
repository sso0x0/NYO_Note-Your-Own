package com.nyo.global.sms;

import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;

import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** 비밀번호 재설정 인증코드 등 회원에게 보내는 SMS 발송을 담당한다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsService {

    @Value("${solapi.api-key}")
    private String apiKey;

    @Value("${solapi.api-secret}")
    private String apiSecret;

    @Value("${solapi.sender-phone}")
    private String senderPhone;

    private DefaultMessageService messageService;

    @PostConstruct
    void init() {
        // 설정값이 실제로 채워졌는지부터 확인 (yml 경로가 틀리면 여기서 null/빈값이 찍힘)
        log.info("Solapi init - apiKey={}, senderPhone={}",
                apiKey == null ? "NULL" : "***" + apiKey.substring(Math.max(0, apiKey.length() - 4)),
                senderPhone);
        this.messageService = NurigoApp.INSTANCE.initialize(
                apiKey, apiSecret, "https://api.solapi.com"
        );
    }

    // 비밀번호 재설정 인증코드를 SMS로 발송한다
    public void sendPasswordResetCode(String to, String code) {
        Message message = new Message();
        message.setFrom(senderPhone);
        message.setTo(normalize(to));
        message.setText("[NYO] 비밀번호 재설정 인증번호는 [" + code + "] 입니다. 인증코드는 5분간 유효합니다.");
        try {
            messageService.sendOne(new SingleMessageSendingRequest(message));
        } catch (Exception e) {
            log.error("SMS 발송 실패: to={}, from={}", to, senderPhone, e);
            throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
        }
    }

    // 마이페이지에서 전화번호를 변경할 때, 새로 입력한 번호가 본인 소유인지 확인하기 위한 인증코드 발송
    public void sendPhoneVerificationCode(String to, String code) {
        Message message = new Message();
        message.setFrom(senderPhone);
        message.setTo(normalize(to));
        message.setText("[NYO] 휴대폰 번호 변경 인증번호는 [" + code + "] 입니다. 인증코드는 5분간 유효합니다.");
        try {
            messageService.sendOne(new SingleMessageSendingRequest(message));
        } catch (Exception e) {
            log.error("SMS 발송 실패: to={}, from={}", to, senderPhone, e);
            throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
        }
    }
    // 솔라피는 하이픈 없는 번호를 요구하므로 010-1234-5678 -> 01012345678 로 변환
    private String normalize(String phone) {
        return phone.replaceAll("-", "");
    }
}
