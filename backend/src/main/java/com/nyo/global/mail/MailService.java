package com.nyo.global.mail;

import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/** 비밀번호 재설정 인증코드 등 회원에게 보내는 이메일 발송을 담당한다. */
@Component
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[NYO] 비밀번호 재설정 인증코드");
        message.setText("인증코드: " + code + "\n인증코드는 5분간 유효합니다.\n본인이 요청하지 않았다면 이 메일을 무시해주세요.");

        try {
            mailSender.send(message);
        } catch (MailException e) {
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }
}
