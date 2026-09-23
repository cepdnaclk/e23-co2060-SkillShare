package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AdminOverviewDto;
import com.zenware.skillsharebackend.dto.AdminSessionDto;
import com.zenware.skillsharebackend.dto.AdminUpdateUserRequest;
import com.zenware.skillsharebackend.dto.AdminUserDto;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final SessionRepository sessionRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public AdminOverviewDto getOverview() {
        long activeUsers = userRepository.countByIsActive(true);
        long totalUsers = userRepository.count();
        return new AdminOverviewDto(
                totalUsers,
                activeUsers,
                totalUsers - activeUsers,
                skillRepository.count(),
                sessionRepository.count(),
                sessionRepository.countByStatus(SessionStatus.PENDING),
                sessionRepository.countByStatus(SessionStatus.COMPLETED),
                feedbackRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> getUsers(String q) {
        String query = q == null ? "" : q.trim();
        List<User> users = query.isEmpty()
                ? userRepository.findAll()
                : userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
        return users.stream().map(this::toUserDto).toList();
    }

    @Transactional
    public AdminUserDto updateUser(UUID userId, AdminUpdateUserRequest request) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User admin = userService.getAuthenticatedUser();

        if (request.role() != null) {
            target.setRole(request.role());
        }

        if (request.isActive() != null) {
            if (admin.getId().equals(target.getId()) && !request.isActive()) {
                throw new IllegalArgumentException("Admins cannot deactivate their own account");
            }
            target.setIsActive(request.isActive());
        }

        return toUserDto(userRepository.save(target));
    }

    @Transactional(readOnly = true)
    public List<Skill> getSkills() {
        return skillRepository.findAll();
    }

    @Transactional
    public Skill createSkill(Skill skill) {
        if (skill.getName() == null || skill.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Skill name is required");
        }
        skillRepository.findByNameIgnoreCase(skill.getName().trim())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Skill already exists");
                });
        skill.setName(skill.getName().trim());
        if (skill.getCategory() != null) {
            skill.setCategory(skill.getCategory().trim());
        }
        return skillRepository.save(skill);
    }

    @Transactional
    public void deleteSkill(UUID skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new IllegalArgumentException("Skill not found");
        }
        try {
            skillRepository.deleteById(skillId);
            skillRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Skill is in use and cannot be deleted");
        }
    }

    @Transactional(readOnly = true)
    public List<AdminSessionDto> getRecentSessions() {
        return sessionRepository.findAll(PageRequest.of(0, 50)).stream()
                .map(this::toSessionDto)
                .toList();
    }

    private AdminUserDto toUserDto(User user) {
        return new AdminUserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : Role.USER,
                user.getIsActive(),
                user.getCredits(),
                user.getXp(),
                user.getLevel(),
                user.getReputationScore(),
                user.getIsProfileCompleted(),
                user.getCreatedAt()
        );
    }

    private AdminSessionDto toSessionDto(Session session) {
        return new AdminSessionDto(
                session.getId(),
                session.getLearner().getId(),
                session.getLearner().getFullName(),
                session.getMentor().getId(),
                session.getMentor().getFullName(),
                session.getSkill().getId(),
                session.getSkill().getName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus(),
                session.getCreditValue(),
                session.getCreatedAt()
        );
    }
}
