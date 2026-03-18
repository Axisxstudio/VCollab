# VCollab – Folder Structure Reference

---

## Frontend: React + Vite

```
vcollab-frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png
│
├── src/
│   ├── main.jsx                    ← Vite entry, Providers wrapper
│   ├── App.jsx                     ← Router config, global layout
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── styles/
│   │   ├── global.css              ← CSS reset + base styles
│   │   ├── variables.css           ← CSS custom properties (colors, spacing)
│   │   ├── antd-theme.js           ← Ant Design token overrides
│   │   └── animations.css          ← Shared Framer Motion keyframes
│   │
│   ├── config/
│   │   ├── constants.js            ← app-wide constants (API_URL, roles)
│   │   ├── routes.js               ← Route path constants
│   │   └── permissions.js          ← Role capability map
│   │
│   ├── lib/
│   │   ├── axios.js                ← Axios instance with JWT interceptors
│   │   ├── queryClient.js          ← React Query client config
│   │   └── websocket.js            ← SockJS + STOMP client factory
│   │
│   ├── store/                      ← Zustand global stores
│   │   ├── authStore.js            ← currentUser, token, role
│   │   ├── notificationStore.js    ← unread count, notification list
│   │   ├── chatStore.js            ← active conversation, unread msgs
│   │   └── uiStore.js              ← sidebar open, modal state, theme
│   │
│   ├── hooks/                      ← Reusable custom React hooks
│   │   ├── useAuth.js
│   │   ├── useWebSocket.js
│   │   ├── useNotifications.js
│   │   ├── useInfiniteScroll.js
│   │   ├── useDebounce.js
│   │   ├── useMediaUpload.js
│   │   └── useCurrentUser.js
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── generateSlug.js
│   │   ├── fileValidation.js
│   │   ├── copyToClipboard.js
│   │   ├── buildSearchParams.js
│   │   └── roleHelpers.js
│   │
│   ├── validation/                 ← Zod schemas
│   │   ├── auth.schema.js
│   │   ├── profile.schema.js
│   │   ├── project.schema.js
│   │   ├── post.schema.js
│   │   ├── blog.schema.js
│   │   ├── comment.schema.js
│   │   └── report.schema.js
│   │
│   ├── types/                      ← JSDoc typedefs or TypeScript interfaces
│   │   ├── user.types.js
│   │   ├── content.types.js
│   │   └── notification.types.js
│   │
│   ├── services/                   ← Axios API service functions
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── profile.service.js
│   │   ├── category.service.js
│   │   ├── project.service.js
│   │   ├── post.service.js
│   │   ├── blog.service.js
│   │   ├── media.service.js
│   │   ├── comment.service.js
│   │   ├── like.service.js
│   │   ├── save.service.js
│   │   ├── share.service.js
│   │   ├── follow.service.js
│   │   ├── request.service.js
│   │   ├── message.service.js
│   │   ├── notification.service.js
│   │   ├── report.service.js
│   │   ├── search.service.js
│   │   └── admin.service.js
│   │
│   ├── layouts/
│   │   ├── MainLayout.jsx           ← Navbar + Sidebar + Footer wrapper
│   │   ├── AuthLayout.jsx           ← Centered layout for auth pages
│   │   ├── AdminLayout.jsx          ← Admin sidebar + header
│   │   └── PublicLayout.jsx         ← Landing page layout
│   │
│   ├── components/                  ← Pure, reusable UI components
│   │   ├── common/
│   │   │   ├── AppButton.jsx
│   │   │   ├── AppCard.jsx
│   │   │   ├── AppModal.jsx
│   │   │   ├── AppBadge.jsx
│   │   │   ├── AppTag.jsx
│   │   │   ├── AppAvatar.jsx
│   │   │   ├── AppEmptyState.jsx
│   │   │   ├── AppLoadingSpinner.jsx
│   │   │   ├── AppErrorState.jsx
│   │   │   ├── AppPagination.jsx
│   │   │   ├── AppToggle.jsx
│   │   │   └── AppConfirmModal.jsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MobileMenu.jsx
│   │   │   └── AdminSidebar.jsx
│   │   │
│   │   ├── content/
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── BlogCard.jsx
│   │   │   ├── UserCard.jsx
│   │   │   ├── ContentInteractionBar.jsx  ← like/comment/save/share/report
│   │   │   ├── AuthorChip.jsx             ← clickable author identity
│   │   │   ├── CategoryChip.jsx
│   │   │   ├── TagList.jsx
│   │   │   ├── TechStackList.jsx
│   │   │   └── MediaPreviewGrid.jsx
│   │   │
│   │   ├── media/
│   │   │   ├── MediaUploader.jsx
│   │   │   ├── ImagePreview.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   └── DragDropZone.jsx
│   │   │
│   │   ├── category/
│   │   │   ├── CategorySelect.jsx        ← live search + inline create
│   │   │   └── CategoryFilterBar.jsx
│   │   │
│   │   ├── comment/
│   │   │   ├── CommentSection.jsx
│   │   │   ├── CommentItem.jsx
│   │   │   ├── CommentForm.jsx
│   │   │   └── ReplyList.jsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── NotificationDropdown.jsx
│   │   │   ├── NotificationItem.jsx
│   │   │   └── NotificationToast.jsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ConversationList.jsx
│   │   │   ├── MessageWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── TypingIndicator.jsx
│   │   │
│   │   └── admin/
│   │       ├── AdminTable.jsx
│   │       ├── AdminStatCard.jsx
│   │       ├── AdminToggle.jsx
│   │       ├── AdminFilterBar.jsx
│   │       └── AdminExportButton.jsx
│   │
│   ├── pages/                       ← Route-level page components
│   │   ├── public/
│   │   │   └── LandingPage.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   │
│   │   ├── home/
│   │   │   └── HomePage.jsx          ← Feed page
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.jsx
│   │   │   └── EditProfilePage.jsx
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── CreateProjectPage.jsx
│   │   │   └── EditProjectPage.jsx
│   │   │
│   │   ├── posts/
│   │   │   ├── PostsPage.jsx
│   │   │   ├── PostDetailPage.jsx
│   │   │   └── CreatePostPage.jsx
│   │   │
│   │   ├── blogs/
│   │   │   ├── BlogsPage.jsx
│   │   │   ├── BlogDetailPage.jsx
│   │   │   ├── CreateBlogPage.jsx
│   │   │   └── EditBlogPage.jsx
│   │   │
│   │   ├── messages/
│   │   │   ├── MessagesPage.jsx
│   │   │   └── ChatPage.jsx
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationsPage.jsx
│   │   │
│   │   ├── saved/
│   │   │   └── SavedPage.jsx
│   │   │
│   │   ├── connections/
│   │   │   └── ConnectionsPage.jsx
│   │   │
│   │   ├── requests/
│   │   │   └── RequestsPage.jsx
│   │   │
│   │   ├── search/
│   │   │   └── SearchPage.jsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardPage.jsx
│   │       ├── AdminUsersPage.jsx
│   │       ├── AdminUserDetailPage.jsx
│   │       ├── AdminProjectsPage.jsx
│   │       ├── AdminPostsPage.jsx
│   │       ├── AdminBlogsPage.jsx
│   │       ├── AdminCategoriesPage.jsx
│   │       ├── AdminReportsPage.jsx
│   │       ├── AdminWarningsPage.jsx
│   │       ├── AdminNotificationsPage.jsx
│   │       ├── AdminRecycleBinPage.jsx
│   │       ├── AdminExportPage.jsx
│   │       └── AdminAuditLogsPage.jsx
│   │
│   └── router/
│       ├── AppRouter.jsx            ← BrowserRouter + routes tree
│       ├── ProtectedRoute.jsx       ← Auth guard HOC
│       └── AdminRoute.jsx           ← SUPER_ADMIN guard HOC
│
├── .env                             ← VITE_API_URL, VITE_WS_URL
├── .env.development
├── .env.production
├── vite.config.js
├── package.json
└── index.html
```

---

## Backend: Spring Boot

```
vcollab-backend/
├── src/
│   └── main/
│       ├── java/com/vtechai/vcollab/
│       │   │
│       │   ├── VCollabApplication.java          ← @SpringBootApplication main
│       │   │
│       │   ├── config/
│       │   │   ├── SecurityConfig.java           ← Spring Security config
│       │   │   ├── WebSocketConfig.java          ← STOMP WebSocket config
│       │   │   ├── CorsConfig.java
│       │   │   ├── JpaConfig.java                ← Auditing enable
│       │   │   ├── AsyncConfig.java              ← @EnableAsync config
│       │   │   ├── MediaStorageConfig.java        ← Upload dir setup
│       │   │   └── OpenApiConfig.java            ← Swagger config
│       │   │
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java         ← Generate/validate JWT
│       │   │   ├── JwtAuthFilter.java            ← OncePerRequestFilter
│       │   │   ├── CustomUserDetailsService.java ← UserDetailsService impl
│       │   │   └── HandshakeInterceptor.java     ← WebSocket JWT validation
│       │   │
│       │   ├── common/
│       │   │   ├── ApiResponse.java              ← Generic response wrapper
│       │   │   ├── PageResponse.java             ← Paginated response wrapper
│       │   │   ├── BaseEntity.java               ← createdAt, updatedAt, deletedAt
│       │   │   └── AppConstants.java             ← App-wide constants
│       │   │
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   ├── ResourceNotFoundException.java
│       │   │   ├── UnauthorizedException.java
│       │   │   ├── ForbiddenException.java
│       │   │   ├── DuplicateResourceException.java
│       │   │   ├── MediaUploadException.java
│       │   │   └── ValidationException.java
│       │   │
│       │   ├── enums/
│       │   │   ├── Role.java
│       │   │   ├── Visibility.java
│       │   │   ├── ContentType.java
│       │   │   ├── MediaType.java
│       │   │   ├── NotificationType.java
│       │   │   ├── ReportReason.java
│       │   │   ├── ReportStatus.java
│       │   │   ├── RequestStatus.java
│       │   │   ├── PostType.java
│       │   │   ├── CategoryType.java
│       │   │   └── AuditActionType.java
│       │   │
│       │   ├── auth/
│       │   │   ├── AuthController.java
│       │   │   ├── AuthService.java
│       │   │   ├── AuthServiceImpl.java
│       │   │   ├── dto/
│       │   │   │   ├── RegisterRequest.java
│       │   │   │   ├── LoginRequest.java
│       │   │   │   ├── ResetPasswordRequest.java
│       │   │   │   └── AuthResponse.java
│       │   │   └── PasswordResetTokenRepository.java
│       │   │
│       │   ├── user/
│       │   │   ├── UserController.java
│       │   │   ├── UserService.java
│       │   │   ├── UserServiceImpl.java
│       │   │   ├── UserRepository.java
│       │   │   ├── UserProfileRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── User.java
│       │   │   │   └── UserProfile.java
│       │   │   └── dto/
│       │   │       ├── UserResponse.java
│       │   │       ├── ProfileUpdateRequest.java
│       │   │       └── UserProfileResponse.java
│       │   │
│       │   ├── category/
│       │   │   ├── CategoryController.java
│       │   │   ├── CategoryService.java
│       │   │   ├── CategoryServiceImpl.java
│       │   │   ├── CategoryRepository.java
│       │   │   ├── entity/Category.java
│       │   │   └── dto/
│       │   │       ├── CategoryRequest.java
│       │   │       └── CategoryResponse.java
│       │   │
│       │   ├── project/
│       │   │   ├── ProjectController.java
│       │   │   ├── ProjectService.java
│       │   │   ├── ProjectServiceImpl.java
│       │   │   ├── ProjectRepository.java
│       │   │   ├── ProjectMediaRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── Project.java
│       │   │   │   └── ProjectMedia.java
│       │   │   └── dto/
│       │   │       ├── ProjectRequest.java
│       │   │       ├── ProjectResponse.java
│       │   │       └── ProjectSummary.java
│       │   │
│       │   ├── post/
│       │   │   ├── PostController.java
│       │   │   ├── PostService.java
│       │   │   ├── PostServiceImpl.java
│       │   │   ├── PostRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── Post.java
│       │   │   │   └── PostMedia.java
│       │   │   └── dto/
│       │   │       ├── PostRequest.java
│       │   │       └── PostResponse.java
│       │   │
│       │   ├── blog/
│       │   │   ├── BlogController.java
│       │   │   ├── BlogService.java
│       │   │   ├── BlogServiceImpl.java
│       │   │   ├── BlogRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── Blog.java
│       │   │   │   └── BlogMedia.java
│       │   │   └── dto/
│       │   │       ├── BlogRequest.java
│       │   │       └── BlogResponse.java
│       │   │
│       │   ├── comment/
│       │   │   ├── CommentController.java
│       │   │   ├── CommentService.java
│       │   │   ├── CommentServiceImpl.java
│       │   │   ├── CommentRepository.java
│       │   │   ├── entity/Comment.java
│       │   │   └── dto/
│       │   │       ├── CommentRequest.java
│       │   │       └── CommentResponse.java
│       │   │
│       │   ├── interaction/
│       │   │   ├── like/
│       │   │   │   ├── LikeController.java
│       │   │   │   ├── LikeService.java
│       │   │   │   ├── LikeRepository.java
│       │   │   │   └── entity/Like.java
│       │   │   ├── save/
│       │   │   │   ├── SaveController.java
│       │   │   │   ├── SaveService.java
│       │   │   │   ├── SaveRepository.java
│       │   │   │   └── entity/Save.java
│       │   │   └── share/
│       │   │       ├── ShareController.java
│       │   │       ├── ShareService.java
│       │   │       ├── ShareRepository.java
│       │   │       └── entity/Share.java
│       │   │
│       │   ├── follow/
│       │   │   ├── FollowController.java
│       │   │   ├── FollowService.java
│       │   │   ├── FollowServiceImpl.java
│       │   │   ├── FollowRepository.java
│       │   │   └── entity/Follow.java
│       │   │
│       │   ├── tag/
│       │   │   ├── TagService.java
│       │   │   ├── TagRepository.java
│       │   │   ├── ContentTagRepository.java
│       │   │   ├── entity/Tag.java
│       │   │   └── entity/ContentTag.java
│       │   │
│       │   ├── media/
│       │   │   ├── MediaController.java
│       │   │   ├── MediaService.java
│       │   │   ├── MediaServiceImpl.java
│       │   │   └── dto/MediaUploadResponse.java
│       │   │
│       │   ├── request/
│       │   │   ├── ProjectRequestController.java
│       │   │   ├── ProjectRequestService.java
│       │   │   ├── ProjectRequestServiceImpl.java
│       │   │   ├── ProjectRequestRepository.java
│       │   │   ├── ProjectRequestAttachmentRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── ProjectRequest.java
│       │   │   │   └── ProjectRequestAttachment.java
│       │   │   └── dto/
│       │   │       ├── ProjectRequestDto.java
│       │   │       └── ProjectRequestResponse.java
│       │   │
│       │   ├── message/
│       │   │   ├── MessageController.java
│       │   │   ├── MessageService.java
│       │   │   ├── MessageServiceImpl.java
│       │   │   ├── ConversationRepository.java
│       │   │   ├── ConversationMemberRepository.java
│       │   │   ├── MessageRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── Conversation.java
│       │   │   │   ├── ConversationMember.java
│       │   │   │   └── Message.java
│       │   │   └── dto/
│       │   │       ├── SendMessageRequest.java
│       │   │       ├── MessageResponse.java
│       │   │       └── ConversationResponse.java
│       │   │
│       │   ├── notification/
│       │   │   ├── NotificationController.java
│       │   │   ├── NotificationService.java
│       │   │   ├── NotificationServiceImpl.java
│       │   │   ├── NotificationRepository.java
│       │   │   ├── NotificationPublisher.java    ← WebSocket push
│       │   │   ├── entity/Notification.java
│       │   │   └── dto/
│       │   │       ├── NotificationResponse.java
│       │   │       └── NotificationEvent.java
│       │   │
│       │   ├── report/
│       │   │   ├── ReportController.java
│       │   │   ├── ReportService.java
│       │   │   ├── ReportServiceImpl.java
│       │   │   ├── ReportRepository.java
│       │   │   ├── entity/Report.java
│       │   │   └── dto/
│       │   │       ├── ReportRequest.java
│       │   │       └── ReportResponse.java
│       │   │
│       │   ├── warning/
│       │   │   ├── WarningController.java
│       │   │   ├── WarningService.java
│       │   │   ├── WarningServiceImpl.java
│       │   │   ├── WarningRepository.java
│       │   │   ├── entity/Warning.java
│       │   │   └── dto/
│       │   │       ├── WarningRequest.java
│       │   │       └── WarningResponse.java
│       │   │
│       │   ├── admin/
│       │   │   ├── AdminUserController.java
│       │   │   ├── AdminContentController.java
│       │   │   ├── AdminDashboardController.java
│       │   │   ├── AdminDashboardService.java
│       │   │   └── dto/
│       │   │       ├── DashboardStatsResponse.java
│       │   │       └── AdminUserDetailResponse.java
│       │   │
│       │   ├── recycle/
│       │   │   ├── RecycleBinController.java
│       │   │   ├── RecycleBinService.java
│       │   │   └── RecycleBinServiceImpl.java
│       │   │
│       │   ├── export/
│       │   │   ├── ExportController.java
│       │   │   ├── ExportService.java
│       │   │   └── ExportServiceImpl.java        ← iText/PDFBox PDF generation
│       │   │
│       │   ├── audit/
│       │   │   ├── AuditService.java
│       │   │   ├── AuditRepository.java
│       │   │   └── entity/AuditLog.java
│       │   │
│       │   ├── search/
│       │   │   ├── SearchController.java
│       │   │   ├── SearchService.java
│       │   │   └── dto/SearchResponse.java
│       │   │
│       │   └── feed/
│       │       ├── FeedController.java
│       │       └── FeedService.java
│       │
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           └── db/
│               ├── schema.sql           ← DDL (optional if using Flyway)
│               ├── seed.sql
│               └── migration/          ← Flyway migrations (V1__init, V2__...)
│
├── pom.xml
└── .env                                ← (gitignored) local secrets
```

---

## Key Architecture Decisions

### Frontend: Feature-based, not Layer-based
Components live near their features. `pages/projects/` contains everything needed for the project screens. Shared/reusable components live in `components/`. This avoids the "god component" problem of layer-based organization.

### Backend: Package-by-feature
Each domain (`project/`, `notification/`, `admin/`) is self-contained with its own controller, service, repo, entity, and dto. Cross-domain dependencies are injected via Spring and kept to service interfaces only.

### Spring Boot Module Boundaries
```
auth/ → only Auth domain
project/ → may call notification/, tag/, media/, category/
notification/ → standalone, receives events from other modules
admin/ → aggregates across all features
export/ → reads from all modules, writes PDF
```
