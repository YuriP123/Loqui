import {
  IconHome,
  IconMicrophone,
  IconFlask,
  IconHistory,
} from "@tabler/icons-react";

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: IconHome,
    },
    {
      title: "My Voices",
      url: "/my-voices",
      icon: IconMicrophone,
    },
    {
      title: "Lab",
      url: "/lab",
      icon: IconFlask,
    },
    {
      title: "Generations",
      url: "/generations",
      icon: IconHistory,
    },
  ],
};
