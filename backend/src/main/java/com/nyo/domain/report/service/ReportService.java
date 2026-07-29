package com.nyo.domain.report.service;

import com.nyo.domain.comment.entity.Comment;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.post.entity.Post;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.domain.report.dto.ReportAdminResponse;
import com.nyo.domain.report.dto.ReportRequest;
import com.nyo.domain.report.entity.Report;
import com.nyo.domain.report.entity.ReportTargetType;
import com.nyo.domain.report.repository.ReportRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final NoteRepository noteRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    @Transactional
    public void create(Long reporterId, ReportRequest request) {
        // 존재하는 대상만 신고할 수 있게 저장 전에 대상 테이블을 확인한다.
        validateTarget(request.targetType(), request.targetId());
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                reporterId, request.targetType(), request.targetId())) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_EXISTS);
        }
        reportRepository.save(Report.create(
                reporterId, request.targetType(), request.targetId(), request.reason()));
    }

    @Transactional(readOnly = true)
    public Page<ReportAdminResponse> findAll(Pageable pageable) {
        // 신고 목록은 항상 최신 신고부터 보여주고, 대상이 삭제되어도 신고 이력은 유지한다.
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toAdminResponse);
    }

    @Transactional
    public void markReviewed(Long reportId) {
        reportRepository.findById(reportId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND))
                .markReviewed();
    }

    private void validateTarget(ReportTargetType type, Long targetId) {
        boolean exists = switch (type) {
            case NOTE -> noteRepository.existsById(targetId);
            case POST -> postRepository.existsById(targetId);
            case COMMENT -> commentRepository.existsById(targetId);
        };
        if (!exists) throw new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND);
    }

    private ReportAdminResponse toAdminResponse(Report report) {
        TargetSummary target = getTargetSummary(report.getTargetType(), report.getTargetId());
        User reporter = userRepository.findById(report.getReporterId()).orElse(null);
        return new ReportAdminResponse(
                report.getId(),
                report.getTargetType(),
                report.getTargetId(),
                target.title(),
                target.content(),
                target.userId(),
                target.page(),
                // 회원 관리 버튼은 신고 대상 작성자가 아니라 표의 신고자 회원 정보를 연다.
                getUserPage(report.getReporterId()),
                report.getReporterId(),
                reporter == null ? "(탈퇴한 사용자)" : reporter.getNickname(),
                report.getReason(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }

    private TargetSummary getTargetSummary(ReportTargetType type, Long targetId) {
        return switch (type) {
            case NOTE -> noteRepository.findById(targetId)
                    .map(note -> new TargetSummary(note.getTitle(), note.getContent(), note.getUserId(),
                            noteRepository.countByCreatedAtAfter(note.getCreatedAt()) / 10))
                    .orElse(new TargetSummary("(삭제된 노트)", "", null, 0));
            case POST -> postRepository.findById(targetId)
                    .map(post -> new TargetSummary(post.getTitle(), post.getContent(), post.getUserId(),
                            postRepository.countByCreatedAtAfter(post.getCreatedAt()) / 10))
                    .orElse(new TargetSummary("(삭제된 게시글)", "", null, 0));
            case COMMENT -> commentRepository.findById(targetId)
                    .map(comment -> new TargetSummary("댓글 #" + comment.getId(), comment.getContent(), comment.getUserId(),
                            commentRepository.countByCreatedAtAfter(comment.getCreatedAt()) / 10))
                    .orElse(new TargetSummary("(삭제된 댓글)", "", null, 0));
        };
    }

    private long getUserPage(Long userId) {
        if (userId == null) return 0;
        return userRepository.findById(userId)
                .map(user -> userRepository.countByCreatedAtAfter(user.getCreatedAt()) / 10)
                .orElse(0L);
    }

    private record TargetSummary(String title, String content, Long userId, long page) {
    }
}
