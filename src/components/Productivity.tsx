"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const features = [
  {
    title: "Smart Planning",
    description: "Organize tasks with intelligent project planning and scheduling",
    icon: "🎯",
    color: "from-purple-500 to-indigo-600"
  },
  {
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time updates and sharing",
    icon: "👥",
    color: "from-blue-500 to-cyan-600"
  },
  {
    title: "Task Analytics",
    description: "Track progress and performance with detailed insights",
    icon: "📊",
    color: "from-emerald-500 to-teal-600"
  }
];

const FeatureCard = ({ title, description, icon, color, isSelected, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.05 : 1, 
        opacity: isSelected ? 1 : 0.7,
        rotateX: isSelected ? 0 : 10,
        y: isSelected ? -20 : 0,
        transition: {
          duration: 0.8,
          type: "spring",
          stiffness: 100
        }
      }}
      className={`
        relative cursor-pointer
        rounded-xl overflow-hidden
        transform-gpu perspective-1000
        transition-all duration-300
      `}
    >
      <div className={`
        absolute inset-0 bg-gradient-to-br ${color} opacity-90
        transition-all duration-300
      `} />
      
      <div className="relative p-8 backdrop-blur-sm">
        <motion.div 
          className="text-4xl mb-4"
          animate={{
            rotateY: isSelected ? 360 : 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.2
          }}
        >
          {icon}
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/80">{description}</p>
        
        <motion.div
          initial={false}
          animate={{
            scale: isSelected ? 1 : 0.8,
            opacity: isSelected ? 1 : 0
          }}
          className="absolute top-0 right-0 mt-4 mr-4"
        >
          <div className="w-3 h-3 rounded-full bg-white" />
        </motion.div>
      </div>
      
      <motion.div
        initial={false}
        animate={{
          opacity: isSelected ? 1 : 0,
          scale: isSelected ? 1 : 0.8
        }}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
      />
    </motion.div>
  );
};

const Feature3D = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/organizations');
  };
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setSelectedIndex((prev) => (prev + 1) % features.length);
      }, 3000); // Change card every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            Transform Your Workflow
          </motion.h1>
          <motion.p 
            className="text-gray-400 text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Powerful features to boost your productivity
          </motion.p>
        </motion.div>

        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              isSelected={selectedIndex === index}
              onClick={() => {
                setSelectedIndex(index);
                setIsAutoPlaying(false);
              }}
            />
          ))}
        </div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold"
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Feature3D;