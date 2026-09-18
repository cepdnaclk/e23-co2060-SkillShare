package com.zenware.skillsharebackend.persistence;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import com.zenware.skillsharebackend.service.SessionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class PersistenceIntegrityTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private CreditDebtRepository creditDebtRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        // Clean up before starting
        creditDebtRepository.deleteAll();
        sessionRepository.deleteAll();
        connectionRepository.deleteAll();
        userSkillRepository.deleteAll();
        availabilityRepository.deleteAll();
        skillRepository.deleteAll();
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clean up after tests safely
        creditDebtRepository.deleteAll();
        // Assume chat and feedback don't have repositories wired here, so I'll wire them first.
        sessionRepository.deleteAll();
        connectionRepository.deleteAll();
        userSkillRepository.deleteAll();
        availabilityRepository.deleteAll();
        skillRepository.deleteAll();
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    // --- A. UNIQUE CONSTRAINTS ---

    @Test
    void duplicateUserEmail_ThrowsDataIntegrityViolationException() {
        User u1 = User.builder().email("unique@test.com").fullName("User 1").password("pwd").build();
        userRepository.saveAndFlush(u1);

        User u2 = User.builder().email("unique@test.com").fullName("User 2").password("pwd").build();
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(u2);
        });
    }

    @Test
    void duplicateSkillName_ThrowsDataIntegrityViolationException() {
        Skill s1 = Skill.builder().name("Java").category("Tech").build();
        skillRepository.saveAndFlush(s1);

        Skill s2 = Skill.builder().name("Java").category("Language").build();
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            skillRepository.saveAndFlush(s2);
        });
    }

    @Test
    void duplicateConnection_ThrowsDataIntegrityViolationException() {
        User u1 = userRepository.saveAndFlush(User.builder().email("u1@test.com").fullName("1").build());
        User u2 = userRepository.saveAndFlush(User.builder().email("u2@test.com").fullName("2").build());

        Connection c1 = Connection.builder().sender(u1).receiver(u2).status(ConnectionStatus.PENDING).build();
        connectionRepository.saveAndFlush(c1);

        Connection c2 = Connection.builder().sender(u1).receiver(u2).status(ConnectionStatus.ACCEPTED).build();
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            connectionRepository.saveAndFlush(c2);
        });
    }

    @Test
    void duplicateCreditDebtForSession_ThrowsDataIntegrityViolationException() {
        User u1 = userRepository.saveAndFlush(User.builder().email("u1@test.com").fullName("1").build());
        User u2 = userRepository.saveAndFlush(User.builder().email("u2@test.com").fullName("2").build());
        Skill s1 = skillRepository.saveAndFlush(Skill.builder().name("Java").build());

        Session session = sessionRepository.saveAndFlush(Session.builder()
                .learner(u1).mentor(u2).skill(s1)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .build());

        CreditDebt cd1 = CreditDebt.builder()
                .mentor(u2).session(session).amount(10).status(DebtStatus.UNPAID).build();
        creditDebtRepository.saveAndFlush(cd1);

        CreditDebt cd2 = CreditDebt.builder()
                .mentor(u2).session(session).amount(20).status(DebtStatus.UNPAID).build();

        assertThrows(DataIntegrityViolationException.class, () -> {
            creditDebtRepository.saveAndFlush(cd2);
        });
    }

    // --- B. COMPOSITE USERSKILL KEY ---

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Test
    @org.springframework.transaction.annotation.Transactional
    void duplicateUserSkillCompositeKey_ThrowsDataIntegrityViolationException() {
        User u1 = userRepository.saveAndFlush(User.builder().email("u1@test.com").fullName("1").build());
        Skill s1 = skillRepository.saveAndFlush(Skill.builder().name("Java").build());

        UserSkill us1 = UserSkill.builder()
                .id(UserSkillId.builder().userId(u1.getId()).skillId(s1.getId()).skillType("TEACH").build())
                .user(u1).skill(s1)
                .build();
        userSkillRepository.saveAndFlush(us1);

        assertThrows(Exception.class, () -> {
            // Using native SQL because JPA's save() performs an UPDATE (merge) on matching IDs instead of failing
            entityManager.createNativeQuery("INSERT INTO user_skills (user_id, skill_id, skill_type) VALUES (?, ?, ?)")
                    .setParameter(1, u1.getId())
                    .setParameter(2, s1.getId())
                    .setParameter(3, "TEACH")
                    .executeUpdate();
        });
    }

    @Test
    void sameUserSkillWithDifferentTypes_Allowed() {
        User u1 = userRepository.saveAndFlush(User.builder().email("u1@test.com").fullName("1").build());
        Skill s1 = skillRepository.saveAndFlush(Skill.builder().name("Java").build());

        UserSkill usTeach = UserSkill.builder()
                .id(UserSkillId.builder().userId(u1.getId()).skillId(s1.getId()).skillType("TEACH").build())
                .user(u1).skill(s1)
                .build();
        userSkillRepository.saveAndFlush(usTeach);

        UserSkill usLearn = UserSkill.builder()
                .id(UserSkillId.builder().userId(u1.getId()).skillId(s1.getId()).skillType("LEARN").build())
                .user(u1).skill(s1)
                .build();
        userSkillRepository.saveAndFlush(usLearn);

        assertEquals(2, userSkillRepository.findByUserId(u1.getId()).size());
        
        // Deleting one does not affect the other
        userSkillRepository.delete(usTeach);
        userSkillRepository.flush();
        
        assertEquals(1, userSkillRepository.findByUserId(u1.getId()).size());
        assertEquals("LEARN", userSkillRepository.findByUserId(u1.getId()).get(0).getId().getSkillType());
    }

    // --- C. ENUM PERSISTENCE ---

    @Test
    void enumsArePersistedAsStrings() {
        User u1 = userRepository.saveAndFlush(User.builder()
                .email("u1@test.com")
                .fullName("1")
                .role(Role.USER) // Enum
                .authProvider(AuthProvider.LOCAL) // Enum
                .build());

        Optional<User> retrieved = userRepository.findById(u1.getId());
        assertTrue(retrieved.isPresent());
        assertEquals(Role.USER, retrieved.get().getRole());
        assertEquals(AuthProvider.LOCAL, retrieved.get().getAuthProvider());
    }

    // --- D. TIMESTAMP GENERATION ---

    @Test
    void creationTimestampIsGenerated() {
        User u1 = userRepository.saveAndFlush(User.builder().email("u1@test.com").fullName("1").build());
        
        Optional<User> retrieved = userRepository.findById(u1.getId());
        assertTrue(retrieved.isPresent());
        assertNotNull(retrieved.get().getCreatedAt());
    }

    // --- E. FOREIGN KEY INTEGRITY ---

    @Test
    void deletingUserReferencedBySession_ThrowsDataIntegrityViolationException() {
        User learner = userRepository.saveAndFlush(User.builder().email("learner@test.com").fullName("L").build());
        User mentor = userRepository.saveAndFlush(User.builder().email("mentor@test.com").fullName("M").build());
        Skill skill = skillRepository.saveAndFlush(Skill.builder().name("Java").build());

        sessionRepository.saveAndFlush(Session.builder()
                .learner(learner).mentor(mentor).skill(skill)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .build());

        // Attempting to delete the mentor without cascading
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.delete(mentor);
            userRepository.flush();
        });
    }

    // --- F. TRANSACTION ROLLBACK ---

    @Test
    void bookingSessionWithInsufficientCredits_RollsBack() {
        // Create mentor
        User mentor = userRepository.saveAndFlush(User.builder().email("mentor@test.com").fullName("M").build());
        Skill skill = skillRepository.saveAndFlush(Skill.builder().name("Java").build());
        
        // Create learner with only 5 credits (booking requires 10)
        User learner = userRepository.saveAndFlush(User.builder().email("learner@test.com").fullName("L").credits(5).build());

        // Mock authentication
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(learner.getEmail(), "password")
        );

        Availability availability = availabilityRepository.saveAndFlush(Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .build());

        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(availability.getId());

        // Expect an illegal state exception due to insufficient credits
        assertThrows(IllegalStateException.class, () -> {
            sessionService.bookSession(request);
        });

        // VERIFY: The session was rolled back (0 sessions exist)
        assertEquals(0, sessionRepository.count());
        
        // VERIFY: The learner's credits were not deducted
        User updatedLearner = userRepository.findById(learner.getId()).get();
        assertEquals(5, updatedLearner.getCredits());

        // VERIFY: No notification was accidentally committed
        assertEquals(0, notificationRepository.count());
        
        SecurityContextHolder.clearContext();
    }
}
