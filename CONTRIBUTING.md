# Contributing to Jono

Thank you for your interest in contributing to Jono! This guide will help you get started.

## Development Setup

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Start development**: `npx expo start`
4. For full native features, create a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

## Guidelines

### Code Style

- TypeScript is required for all source files
- Use functional components with hooks
- Follow existing patterns in the codebase (Zustand stores, service modules, custom hooks)

### Privacy First

Jono's core promise is that data never leaves the device. When contributing:

- **Do not** add network calls that transmit user data
- **Do not** add analytics, telemetry, or tracking
- **Do not** add cloud storage or sync features
- **Do not** add third-party SDKs that collect data
- Any AI features must use on-device processing (Apple Intelligence)

### Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what and why
- Test on a real device when possible (simulator lacks microphone/speech features)
- Ensure the app builds without errors

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, Refactor)

### Reporting Issues

- Use GitHub Issues
- Include device model, iOS version, and steps to reproduce
- Screenshots or screen recordings are helpful

## Architecture Notes

- **Screens** live in `app/` using Expo Router's file-based routing
- **Business logic** lives in `services/` — keep components thin
- **State** is managed with Zustand stores in `stores/`
- **Hooks** in `hooks/` bridge services and components
- Components in `components/` should be reusable and presentational

## Areas for Contribution

- Accessibility improvements
- Localization / i18n support
- New content transformation types
- UI/UX enhancements
- Performance optimizations
- Documentation

## Questions?

Open an issue or start a discussion. We're happy to help!
